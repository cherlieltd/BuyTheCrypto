import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { adminAuditLogs } from "@/db/schema";
import { formatTimestamp } from "@/lib/utils";

export default async function AuditLogPage() {
  const auth = await requireAdmin();
  const logs = await auth.db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(200);
  return (
    <main>
      <h1 className="text-3xl font-semibold">Audit logs</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {logs.map((log) => (
          <li key={log.id} className="rounded-2xl border border-white/10 px-4 py-3">
            <span className="font-medium">{log.action}</span>
            <span className="text-muted"> · {log.targetType} {log.targetId ?? ""} · {formatTimestamp(log.createdAt)}</span>
          </li>
        ))}
        {logs.length === 0 ? <li className="text-muted">No administrator actions have been recorded.</li> : null}
      </ul>
    </main>
  );
}
