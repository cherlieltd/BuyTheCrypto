import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { parseVerifiedWebhook, verifyTransakWebhookJwt } from "@/lib/transak/webhook";
import { reconcileTransakEvent, type OrderRepository, type StoredOrder, type StoredWebhookEvent } from "@/lib/orders/reconcile";
import { shouldApplyStatus } from "@/lib/orders/status";
import { validateDestinationWallet, validateEvmAddress } from "@/lib/wallets/validate";
import { buildWidgetParams, bindTransakWidgetEvents } from "@/lib/transak/widget";
import { consumeMemoryLimit, resetMemoryLimits } from "@/lib/security/rate-limit";
import { clientOrderUpdateSchema, loginSchema, registerSchema } from "@/lib/validation/schemas";
import { assertOrderAccess } from "@/lib/orders/access";
import { ApiError } from "@/lib/errors";
import { normalizeMarketCoin } from "@/lib/markets/normalize";

function memoryRepository(seed: StoredOrder): OrderRepository & { events: StoredWebhookEvent[]; order: StoredOrder } {
  const state = { events: [] as StoredWebhookEvent[], order: { ...seed } };
  return {
    events: state.events,
    get order() {
      return state.order;
    },
    async findEvent(_provider, providerEventId) {
      return state.events.find((event) => event.providerEventId === providerEventId) ?? null;
    },
    async insertEvent(event) {
      state.events.push(event);
    },
    async findOrderById(id) {
      return state.order.id === id ? state.order : null;
    },
    async findOrderByProviderOrderId(providerOrderId) {
      return state.order.providerOrderId === providerOrderId ? state.order : null;
    },
    async updateOrder(_id, patch) {
      state.order = { ...state.order, ...patch, provider: "transak" };
      return state.order;
    },
  };
}

const order = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  provider: "transak" as const,
  providerOrderId: "transak-order-1",
  fiatCurrency: "USD",
  fiatAmount: "100.00",
  cryptoCurrency: "ETH",
  cryptoAmount: null,
  blockchainNetwork: "ethereum",
  walletAddress: "0x0000000000000000000000000000000000000001",
  status: "AWAITING_PAYMENT_FROM_USER",
  providerReference: null,
};

function signedEvent(secret: string, status: string, eventID: string) {
  const token = jwt.sign(
    {
      eventID,
      createdAt: new Date().toISOString(),
      webhookData: {
        id: "transak-order-1",
        status,
        fiatCurrency: "USD",
        fiatAmount: 100,
        cryptoCurrency: "ETH",
        cryptoAmount: 0.03,
        network: "ethereum",
        partnerOrderId: order.id,
        walletAddress: order.walletAddress,
      },
    },
    secret,
    { algorithm: "HS256" },
  );
  return { token, event: parseVerifiedWebhook(token, verifyTransakWebhookJwt(token, [secret])) };
}

describe("authentication input", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse({ fullName: "Cherlie", email: "cherlie@example.com", password: "correct-horse" }).success).toBe(true);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ fullName: "Cherlie", email: "cherlie@example.com", password: "short" }).success).toBe(false);
  });

  it("requires an email and password to log in", () => {
    expect(loginSchema.safeParse({ email: "cherlie@example.com", password: "secret" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
  });
});

describe("authorization", () => {
  it("hides another customer's order", () => {
    expect(() => assertOrderAccess(order.userId, "33333333-3333-4333-8333-333333333333")).toThrow(ApiError);
  });

  it("allows the owner and an administrator", () => {
    expect(() => assertOrderAccess(order.userId, order.userId)).not.toThrow();
    expect(() => assertOrderAccess(order.userId, "33333333-3333-4333-8333-333333333333", true)).not.toThrow();
  });
});

describe("wallets", () => {
  it("accepts a checksummed EVM address", () => {
    expect(validateEvmAddress("0x0000000000000000000000000000000000000001")).toBe(true);
  });

  it("rejects an invalid EVM address", async () => {
    const result = await validateDestinationWallet({ address: "not-a-wallet", network: "ethereum", cryptoCurrency: "ETH" });
    expect(result.ok).toBe(false);
  });

  it("does not accept an unverified non-EVM address", async () => {
    const result = await validateDestinationWallet({ address: "So11111111111111111111111111111111111111112", network: "solana", cryptoCurrency: "SOL" });
    expect(result.ok).toBe(false);
  });
});

describe("transak widget", () => {
  it("builds a server widget payload without the API secret", () => {
    const params = buildWidgetParams({
      apiKey: "publishable-key",
      referrerDomain: "buythecrypto.com",
      fiatCurrency: "USD",
      fiatAmount: 50,
      cryptoCurrencyCode: "ETH",
      network: "ethereum",
      walletAddress: "0x0000000000000000000000000000000000000001",
      partnerOrderId: order.id,
      partnerCustomerId: order.userId,
    });
    expect(params.apiKey).toBe("publishable-key");
    expect(params.referrerDomain).toBe("buythecrypto.com");
    expect(JSON.stringify(params)).not.toContain("apiSecret");
  });

  it("routes cancellation and success to separate handlers", () => {
    const calls: string[] = [];
    const handlers = new Map<string, (payload?: unknown) => void>();
    bindTransakWidgetEvents(
      {
        EVENTS: {
          TRANSAK_ORDER_CREATED: "TRANSAK_ORDER_CREATED",
          TRANSAK_ORDER_SUCCESSFUL: "TRANSAK_ORDER_SUCCESSFUL",
          TRANSAK_ORDER_CANCELLED: "TRANSAK_ORDER_CANCELLED",
          TRANSAK_ORDER_FAILED: "TRANSAK_ORDER_FAILED",
          TRANSAK_WIDGET_CLOSE: "TRANSAK_WIDGET_CLOSE",
        },
        on(event, handler) {
          handlers.set(event, handler);
        },
      },
      {
        onCreated: () => calls.push("created"),
        onSuccessful: () => calls.push("reconcile"),
        onCancelled: () => calls.push("cancelled"),
        onFailed: () => calls.push("failed"),
        onClose: () => calls.push("closed"),
      },
    );
    handlers.get("TRANSAK_ORDER_CANCELLED")?.();
    handlers.get("TRANSAK_ORDER_SUCCESSFUL")?.();
    expect(calls).toEqual(["cancelled", "reconcile"]);
    expect(calls).not.toContain("completed");
  });

  it("refuses a browser payload that tries to set status directly", () => {
    const parsed = clientOrderUpdateSchema.safeParse({
      orderId: order.id,
      providerOrderId: "transak-order-1",
      status: "COMPLETED",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("webhooks", () => {
  const secret = "partner-access-token";

  it("rejects an invalid signature", () => {
    const { token } = signedEvent(secret, "COMPLETED", "ORDER_COMPLETED");
    expect(() => verifyTransakWebhookJwt(token, ["other-token"])).toThrow();
  });

  it("ignores a duplicate delivery", async () => {
    const repository = memoryRepository(order);
    const { event } = signedEvent(secret, "PROCESSING", "ORDER_PROCESSING");
    await reconcileTransakEvent(repository, event);
    const second = await reconcileTransakEvent(repository, event);
    expect(second.duplicate).toBe(true);
    expect(repository.events).toHaveLength(1);
    expect(event.providerEventId).toHaveLength(64);
  });

  it("does not move a completed order backward", async () => {
    const repository = memoryRepository({ ...order, status: "COMPLETED" });
    const { event } = signedEvent(secret, "PROCESSING", "ORDER_PROCESSING");
    const result = await reconcileTransakEvent(repository, event);
    expect(result.applied).toBe(false);
    expect(result.ignoredReason).toBe("out_of_order");
    expect(repository.order.status).toBe("COMPLETED");
    expect(shouldApplyStatus("COMPLETED", "PROCESSING")).toBe(false);
    expect(shouldApplyStatus("PROCESSING", "COMPLETED")).toBe(true);
  });

  it("applies a later refund after completion", async () => {
    const repository = memoryRepository({ ...order, status: "COMPLETED" });
    const { event } = signedEvent(secret, "REFUNDED", "ORDER_REFUNDED");
    const result = await reconcileTransakEvent(repository, event);
    expect(result.applied).toBe(true);
    expect(repository.order.status).toBe("REFUNDED");
  });
});

describe("rate limiting", () => {
  it("blocks the request after the limit", () => {
    resetMemoryLimits();
    expect(consumeMemoryLimit("tester", 2, 60_000).success).toBe(true);
    expect(consumeMemoryLimit("tester", 2, 60_000).success).toBe(true);
    expect(consumeMemoryLimit("tester", 2, 60_000).success).toBe(false);
  });
});

describe("market data", () => {
  it("keeps the provider timestamp on a normalized quote", () => {
    const quote = normalizeMarketCoin({
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      current_price: 1,
      market_cap: 2,
      total_volume: 3,
      price_change_percentage_24h: 4,
      last_updated: "2026-11-06T00:00:00.000Z",
    });
    expect(quote.updatedAt).toBe("2026-11-06T00:00:00.000Z");
    expect(quote.symbol).toBe("BTC");
  });
});
