import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { VerifiedTransakEvent } from "@/lib/orders/reconcile";

export function webhookEventId(rawJwt: string) {
  return createHash("sha256").update(rawJwt).digest("hex");
}

export function verifyTransakWebhookJwt(rawJwt: string, accessTokens: string[]) {
  const secrets = accessTokens.filter((token) => token.length > 0);
  if (secrets.length === 0) {
    throw new Error("No Transak access token is available to verify the webhook.");
  }

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(rawJwt, secret, { algorithms: ["HS256"] });
      if (!decoded || typeof decoded === "string") {
        throw new Error("Webhook JWT did not contain claims.");
      }
      return decoded as jwt.JwtPayload;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Webhook signature verification failed.");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseVerifiedWebhook(rawJwt: string, claims: jwt.JwtPayload): VerifiedTransakEvent {
  const webhookData = asRecord(claims.webhookData) ?? {};
  return {
    providerEventId: webhookEventId(rawJwt),
    eventType: asString(claims.eventID) ?? "UNKNOWN",
    createdAt: asString(claims.createdAt),
    order: {
      id: asString(webhookData.id),
      status: asString(webhookData.status),
      fiatCurrency: asString(webhookData.fiatCurrency),
      fiatAmount: asNumber(webhookData.fiatAmount),
      cryptoCurrency: asString(webhookData.cryptoCurrency),
      cryptoAmount: asNumber(webhookData.cryptoAmount),
      network: asString(webhookData.network),
      walletAddress: asString(webhookData.walletAddress),
      partnerOrderId: asString(webhookData.partnerOrderId),
      partnerCustomerId: asString(webhookData.partnerCustomerId),
      transactionHash: asString(webhookData.transactionHash),
    },
  };
}
