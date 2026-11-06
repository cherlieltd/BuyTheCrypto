import "server-only";
import { ApiError } from "@/lib/errors";
import { clientIp, transakConfig } from "@/lib/transak/config";
import { buildWidgetParams, type WidgetSessionInput } from "@/lib/transak/widget";
import { getDb } from "@/db";
import { providerTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

type AccessToken = { token: string; previous?: string; expiresAt: number };

let memoryToken: AccessToken | null = null;

type JsonRecord = Record<string, unknown>;

async function transakFetch(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { message: text };
    }
  }
  if (!response.ok) {
    const record = body && typeof body === "object" ? (body as JsonRecord) : {};
    const error = record.error && typeof record.error === "object" ? (record.error as JsonRecord) : record;
    const message = typeof error.message === "string" ? error.message : "Transak request failed.";
    throw new ApiError(response.status === 401 ? 502 : 502, "TRANSAK_ERROR", message);
  }
  return body;
}

function requireConfig() {
  const config = transakConfig();
  if (!config.configured) {
    throw new ApiError(
      503,
      "TRANSAK_NOT_CONFIGURED",
      "Transak staging credentials are not configured. Add TRANSAK_API_KEY and TRANSAK_API_SECRET.",
    );
  }
  return config;
}

function decodeExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return Date.now() + 6 * 24 * 60 * 60 * 1000;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : Date.now() + 6 * 24 * 60 * 60 * 1000;
  } catch {
    return Date.now() + 60 * 60 * 1000;
  }
}

async function persistToken(token: AccessToken) {
  memoryToken = token;
  const db = getDb();
  if (!db) return;
  await db
    .insert(providerTokens)
    .values({
      provider: "transak",
      accessToken: token.token,
      previousAccessToken: token.previous ?? null,
      expiresAt: new Date(token.expiresAt),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: providerTokens.provider,
      set: {
        accessToken: token.token,
        previousAccessToken: token.previous ?? null,
        expiresAt: new Date(token.expiresAt),
        updatedAt: new Date(),
      },
    });
}

async function loadStoredToken(): Promise<AccessToken | null> {
  if (memoryToken && memoryToken.expiresAt > Date.now() + 60_000) return memoryToken;
  const seeded = process.env.TRANSAK_ACCESS_TOKEN;
  if (seeded && !memoryToken) {
    memoryToken = { token: seeded, expiresAt: decodeExpiry(seeded) };
  }
  const db = getDb();
  if (!db) return memoryToken;
  const rows = await db.select().from(providerTokens).where(eq(providerTokens.provider, "transak")).limit(1);
  const row = rows[0];
  if (!row) return memoryToken;
  memoryToken = {
    token: row.accessToken,
    previous: row.previousAccessToken ?? undefined,
    expiresAt: row.expiresAt.getTime(),
  };
  return memoryToken;
}

export async function getTransakAccessToken(forceRefresh = false) {
  const config = requireConfig();
  const stored = await loadStoredToken();
  if (!forceRefresh && stored && stored.expiresAt > Date.now() + 60_000) return stored;

  const body = await transakFetch(`${config.apiBaseUrl}/partners/api/v2/refresh-token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-secret": config.apiSecret,
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ apiKey: config.apiKey }),
  });

  const data = (body as JsonRecord).data as JsonRecord | undefined;
  const accessToken = typeof data?.accessToken === "string" ? data.accessToken : "";
  const expiresAtSeconds = typeof data?.expiresAt === "number" ? data.expiresAt : undefined;
  if (!accessToken) {
    throw new ApiError(502, "TRANSAK_ERROR", "Transak did not return an access token.");
  }

  const next: AccessToken = {
    token: accessToken,
    previous: stored?.token && stored.token !== accessToken ? stored.token : stored?.previous,
    expiresAt: expiresAtSeconds ? expiresAtSeconds * 1000 : decodeExpiry(accessToken),
  };
  await persistToken(next);
  return next;
}

export async function getWebhookVerificationTokens() {
  const stored = await loadStoredToken();
  if (stored) return [stored.token, stored.previous].filter((value): value is string => Boolean(value));
  const refreshed = await getTransakAccessToken(false);
  return [refreshed.token, refreshed.previous].filter((value): value is string => Boolean(value));
}

export async function getCryptoCurrencies() {
  const config = requireConfig();
  const body = await transakFetch(`${config.apiBaseUrl}/cryptocoverage/api/v1/public/crypto-currencies`, {
    headers: { "x-api-key": config.apiKey },
  });
  const response = (body as JsonRecord).response;
  return Array.isArray(response) ? response : [];
}

export async function getFiatCurrencies() {
  const config = requireConfig();
  const body = await transakFetch(`${config.apiBaseUrl}/fiat/public/v1/currencies/fiat-currencies`, {
    headers: { "x-api-key": config.apiKey },
  });
  const response = (body as JsonRecord).response;
  return Array.isArray(response) ? response : [];
}

export async function getBuyQuote(input: {
  fiatCurrency: string;
  cryptoCurrency: string;
  network: string;
  fiatAmount: number;
}) {
  const config = requireConfig();
  const params = new URLSearchParams({
    partnerApiKey: config.apiKey,
    fiatCurrency: input.fiatCurrency,
    cryptoCurrency: input.cryptoCurrency,
    network: input.network,
    isBuyOrSell: "BUY",
    fiatAmount: String(input.fiatAmount),
  });
  const body = await transakFetch(`${config.apiBaseUrl}/api/v1/pricing/public/quotes?${params.toString()}`, {
    headers: { "x-api-key": config.apiKey },
  });
  const response = (body as JsonRecord).response;
  if (!response || typeof response !== "object") {
    throw new ApiError(502, "TRANSAK_ERROR", "Transak did not return a quote.");
  }
  return response as JsonRecord;
}

export async function verifyWalletAddress(input: {
  cryptoCurrency: string;
  network: string;
  walletAddress: string;
}) {
  const config = requireConfig();
  const params = new URLSearchParams(input);
  try {
    const body = await transakFetch(
      `${config.apiBaseUrl}/cryptocoverage/api/v1/public/verify-wallet-address?${params.toString()}`,
      { headers: { "x-api-key": config.apiKey } },
    );
    return (body as JsonRecord).response === true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 502) return false;
    throw error;
  }
}

export async function createWidgetSession(
  request: Request,
  input: Omit<WidgetSessionInput, "apiKey" | "referrerDomain">,
) {
  const config = requireConfig();
  const access = await getTransakAccessToken();
  const widgetParams = buildWidgetParams({
    ...input,
    apiKey: config.apiKey,
    referrerDomain: config.referrerDomain,
  });
  const body = await transakFetch(`${config.gatewayBaseUrl}/api/v2/auth/session`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "access-token": access.token,
      "x-api-key": config.apiKey,
      "x-user-ip": clientIp(request),
    },
    body: JSON.stringify({ widgetParams }),
  });
  const data = (body as JsonRecord).data as JsonRecord | undefined;
  const widgetUrl = typeof data?.widgetUrl === "string" ? data.widgetUrl : "";
  if (!widgetUrl) {
    throw new ApiError(502, "TRANSAK_ERROR", "Transak did not return a widget URL.");
  }
  return { widgetUrl, expiresInSeconds: 300 };
}

export async function getTransakOrder(orderId: string) {
  const config = requireConfig();
  const access = await getTransakAccessToken();
  const body = await transakFetch(
    `${config.apiBaseUrl}/partners/api/v2/order/${encodeURIComponent(orderId)}`,
    { headers: { "access-token": access.token, "x-api-key": config.apiKey } },
  );
  const data = (body as JsonRecord).data;
  if (!data || typeof data !== "object") {
    throw new ApiError(502, "TRANSAK_ERROR", "Transak did not return the order.");
  }
  return data as JsonRecord;
}
