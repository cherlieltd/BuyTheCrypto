import { inngest } from "@/inngest/client";
import { syncOrderFromProvider } from "@/lib/orders/sync";

export const reconcileTransakOrder = inngest.createFunction(
  { id: "reconcile-transak-order", retries: 3, triggers: [{ event: "transak/order.reconcile" }] },
  async ({ event }) => {
    const orderId = String(event.data.orderId ?? "");
    if (!orderId) return { skipped: true };
    const order = await syncOrderFromProvider(orderId);
    return { orderId, status: order?.status ?? null };
  },
);

export const functions = [reconcileTransakOrder];
