import { requireUser, listOrdersForUser } from "@/lib/auth";
import { statusLabel } from "@/lib/orders/status";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/orders/status";
import { formatFiat } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const auth = await requireUser();
  const orders = await listOrdersForUser(auth.profile.id);
  const completed = orders.filter((order) => order.status === "COMPLETED").length;
  return (
    <main>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-muted">Orders associated with {auth.profile.email}. Status comes from Transak, not from the browser checkout.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Completed by Transak" value={String(completed)} />
        <Stat label="Open checkouts" value={String(orders.filter((order) => order.status === "CHECKOUT_OPENED").length)} />
      </div>
      <div className="mt-8 space-y-3">
        {orders.slice(0, 5).map((order) => (
          <Link key={order.id} href="/dashboard/orders" className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <span>
              {formatFiat(Number(order.fiatAmount), order.fiatCurrency)} · {order.cryptoCurrency}
            </span>
            <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
          </Link>
        ))}
        {orders.length === 0 ? <p className="text-sm text-muted">No purchases yet.</p> : null}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
