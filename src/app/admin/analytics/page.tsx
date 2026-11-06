import { adminStats, requireAdmin } from "@/lib/auth";

export default async function AnalyticsPage() {
  const stats = await adminStats();
  await requireAdmin();
  const total = Math.max(stats.orders, 1);
  const rows = [
    ["Pending", stats.pending],
    ["Completed", stats.successful],
    ["Failed, cancelled, or expired", stats.failed],
  ];
  return (
    <main>
      <h1 className="text-3xl font-semibold">Analytics</h1>
      <p className="mt-2 text-sm text-muted">Usage here means account and order counts stored by this application.</p>
      <div className="mt-8 space-y-4">
        {rows.map(([label, value]) => (
          <div key={String(label)}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (Number(value) / total) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
