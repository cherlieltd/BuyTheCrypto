import { shouldApplyStatus } from "@/lib/orders/status";

export type StoredOrder = {
  id: string;
  userId: string;
  provider: "transak";
  providerOrderId: string | null;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoCurrency: string;
  cryptoAmount: string | null;
  blockchainNetwork: string;
  walletAddress: string;
  status: string;
  providerReference: string | null;
};

export type StoredWebhookEvent = {
  provider: "transak";
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string | null;
};

export type OrderPatch = {
  providerOrderId?: string | null;
  fiatCurrency?: string;
  fiatAmount?: string;
  cryptoCurrency?: string;
  cryptoAmount?: string | null;
  blockchainNetwork?: string;
  walletAddress?: string;
  status?: string;
  providerReference?: string | null;
};

export type OrderRepository = {
  findEvent(provider: "transak", providerEventId: string): Promise<StoredWebhookEvent | null>;
  insertEvent(event: StoredWebhookEvent): Promise<void>;
  findOrderById(id: string): Promise<StoredOrder | null>;
  findOrderByProviderOrderId(providerOrderId: string): Promise<StoredOrder | null>;
  updateOrder(id: string, patch: OrderPatch): Promise<StoredOrder>;
};

export type VerifiedTransakEvent = {
  providerEventId: string;
  eventType: string;
  createdAt?: string;
  order: {
    id?: string;
    status?: string;
    fiatCurrency?: string;
    fiatAmount?: number;
    cryptoCurrency?: string;
    cryptoAmount?: number;
    network?: string;
    walletAddress?: string;
    partnerOrderId?: string;
    partnerCustomerId?: string;
    transactionHash?: string;
  };
};

export type ReconcileResult = {
  duplicate: boolean;
  applied: boolean;
  ignoredReason?: "duplicate" | "out_of_order" | "unknown_order" | "unknown_status";
  order: StoredOrder | null;
};

function amount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : undefined;
}

export async function reconcileTransakEvent(
  repository: OrderRepository,
  event: VerifiedTransakEvent,
): Promise<ReconcileResult> {
  const existing = await repository.findEvent("transak", event.providerEventId);
  if (existing) {
    const order = event.order.partnerOrderId
      ? await repository.findOrderById(event.order.partnerOrderId)
      : event.order.id
        ? await repository.findOrderByProviderOrderId(event.order.id)
        : null;
    return { duplicate: true, applied: false, ignoredReason: "duplicate", order };
  }

  const payload = {
    eventID: event.eventType,
    createdAt: event.createdAt ?? null,
    id: event.order.id ?? null,
    status: event.order.status ?? null,
    fiatCurrency: event.order.fiatCurrency ?? null,
    fiatAmount: event.order.fiatAmount ?? null,
    cryptoCurrency: event.order.cryptoCurrency ?? null,
    cryptoAmount: event.order.cryptoAmount ?? null,
    network: event.order.network ?? null,
    partnerOrderId: event.order.partnerOrderId ?? null,
    transactionHash: event.order.transactionHash ?? null,
    walletAddressLast4: event.order.walletAddress?.slice(-4) ?? null,
  };

  await repository.insertEvent({
    provider: "transak",
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    payload,
    processedAt: new Date().toISOString(),
  });

  const order = event.order.partnerOrderId
    ? await repository.findOrderById(event.order.partnerOrderId)
    : event.order.id
      ? await repository.findOrderByProviderOrderId(event.order.id)
      : null;

  if (!order) {
    return { duplicate: false, applied: false, ignoredReason: "unknown_order", order: null };
  }

  const incomingStatus = event.order.status;
  if (!incomingStatus || !shouldApplyStatus(order.status, incomingStatus)) {
    const patch: OrderPatch = {};
    if (event.order.id && !order.providerOrderId) patch.providerOrderId = event.order.id;
    if (Object.keys(patch).length === 0) {
      return {
        duplicate: false,
        applied: false,
        ignoredReason: incomingStatus ? "out_of_order" : "unknown_status",
        order,
      };
    }
    const updated = await repository.updateOrder(order.id, patch);
    return {
      duplicate: false,
      applied: false,
      ignoredReason: incomingStatus ? "out_of_order" : "unknown_status",
      order: updated,
    };
  }

  const updated = await repository.updateOrder(order.id, {
    status: incomingStatus,
    providerOrderId: event.order.id ?? order.providerOrderId,
    fiatCurrency: event.order.fiatCurrency ?? order.fiatCurrency,
    fiatAmount: amount(event.order.fiatAmount) ?? order.fiatAmount,
    cryptoCurrency: event.order.cryptoCurrency ?? order.cryptoCurrency,
    cryptoAmount: amount(event.order.cryptoAmount) ?? order.cryptoAmount,
    blockchainNetwork: event.order.network ?? order.blockchainNetwork,
    walletAddress: event.order.walletAddress ?? order.walletAddress,
    providerReference: event.order.id ?? order.providerReference,
  });

  return { duplicate: false, applied: true, order: updated };
}
