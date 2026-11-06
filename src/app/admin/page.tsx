import { adminStats } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { adminAuditLogs, cryptoOrders } from "@/db/schema";
import { statusLabel } from "@/lib/orders/status";
import { formatTimestamp } from "@/lib/utils";

export default async function AdminHomePage() {
  const auth = await requireAdmin();
  const stats = await adminStats();
  const recentOrders = await auth.db.select().from(cryptoOrders).orderBy(desc(cryptoOrders.createdAt)).limit(6);
  const recentAudit = await auth.db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(6);
  const cards = [
    ["Registered users", stats.users],
    ["Associated orders", stats.orders],
    ["Pending", stats.pending],
    ["Completed by Transak", stats.successful],
    ["Failed, cancelled, or expired", stats.failed],
  ];

  return (
    <main>
      <h1 className="text-3xl font-semibold">Administration</h1>
      <p className="mt-2 text-sm text-muted">Counts reflect records in BuyTheCrypto. They do not change a payment inside Transak.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-border p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="font-semibold">Recent orders</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recentOrders.map((order) => (
            <li key={order.id} className="flex justify-between gap-4 rounded-2xl border border-border px-4 py-3">
              <span>{order.cryptoCurrency}</span>
              <span className="text-muted">{statusLabel(order.status)} · {formatTimestamp(order.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-semibold">Recent audit activity</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {recentAudit.map((entry) => (
            <li key={entry.id}>
              {entry.action} · {entry.targetType} · {formatTimestamp(entry.createdAt)}
            </li>
          ))}
          {recentAudit.length === 0 ? <li>No audit events yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
