/**
 * Transak on-ramp statuses from
 * https://docs.transak.com/guides/track-order-status
 * CHECKOUT_OPENED is an internal pre-order state before Transak creates an order.
 */
export const TRANSAK_ORDER_STATUSES = [
  "AWAITING_PAYMENT_FROM_USER",
  "PAYMENT_DONE_MARKED_BY_USER",
  "PROCESSING",
  "PENDING_DELIVERY_FROM_TRANSAK",
  "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
] as const;

export type TransakOrderStatus = (typeof TRANSAK_ORDER_STATUSES)[number];

export const INTERNAL_ORDER_STATUSES = ["CHECKOUT_OPENED"] as const;

export type OrderStatus = TransakOrderStatus | (typeof INTERNAL_ORDER_STATUSES)[number];

const STATUS_RANK: Record<string, number> = {
  CHECKOUT_OPENED: 0,
  AWAITING_PAYMENT_FROM_USER: 10,
  PAYMENT_DONE_MARKED_BY_USER: 20,
  PROCESSING: 30,
  PENDING_DELIVERY_FROM_TRANSAK: 40,
  ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK: 50,
  COMPLETED: 80,
  CANCELLED: 80,
  FAILED: 80,
  EXPIRED: 80,
  REFUNDED: 90,
};

const TERMINAL = new Set(["COMPLETED", "CANCELLED", "FAILED", "EXPIRED", "REFUNDED"]);

export function isKnownOrderStatus(status: string): status is OrderStatus {
  return status in STATUS_RANK;
}

export function shouldApplyStatus(current: string, incoming: string) {
  if (!isKnownOrderStatus(incoming)) return false;
  if (current === incoming) return false;
  if (current === "REFUNDED") return false;
  if (TERMINAL.has(current) && incoming !== "REFUNDED") return false;
  const currentRank = STATUS_RANK[current] ?? 0;
  const incomingRank = STATUS_RANK[incoming] ?? 0;
  return incomingRank >= currentRank;
}

export function statusLabel(status: string) {
  switch (status) {
    case "CHECKOUT_OPENED":
      return "Checkout opened";
    case "AWAITING_PAYMENT_FROM_USER":
      return "Awaiting payment";
    case "PAYMENT_DONE_MARKED_BY_USER":
      return "Payment marked by customer";
    case "PROCESSING":
      return "Processing";
    case "PENDING_DELIVERY_FROM_TRANSAK":
      return "Pending crypto delivery";
    case "ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK":
      return "On hold";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "FAILED":
      return "Failed";
    case "REFUNDED":
      return "Refunded";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export function statusTone(status: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "REFUNDED" || status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
    return "danger" as const;
  }
  if (status === "CHECKOUT_OPENED") return "neutral" as const;
  return "warning" as const;
}
