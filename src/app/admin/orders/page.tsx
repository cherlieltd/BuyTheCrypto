import { requireAdmin } from "@/lib/auth";
import { searchAdminOrders } from "@/lib/orders/store";
import { OrderAdmin } from "@/components/admin/order-admin";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const orders = await searchAdminOrders({ status: params.status, query: params.q });
  return (
    <main>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Refresh asks Transak for the current order. It cannot mark a payment successful or alter delivery.
      </p>
      <form className="mb-6 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={params.q} placeholder="Search" className="h-10 rounded-full border border-white/10 bg-black/20 px-4" aria-label="Search orders" />
        <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-full border border-white/10 bg-black/20 px-4" aria-label="Filter status">
          <option value="">All statuses</option>
          {["CHECKOUT_OPENED", "AWAITING_PAYMENT_FROM_USER", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED", "REFUNDED", "CANCELLED"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="rounded-full border border-white/15 px-4">Filter</button>
      </form>
      <OrderAdmin
        initialOrders={orders.map((order) => ({
          id: order.id,
          status: order.status,
          cryptoCurrency: order.cryptoCurrency,
          fiatAmount: Number(order.fiatAmount),
          fiatCurrency: order.fiatCurrency,
          providerOrderId: order.providerOrderId,
        }))}
      />
    </main>
  );
}
