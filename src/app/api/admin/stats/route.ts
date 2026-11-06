import { handleApi } from "@/lib/api";
import { adminStats } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { adminAuditLogs, cryptoOrders } from "@/db/schema";

export async function GET(request: Request) {
  return handleApi(request, { access: "admin", limit: { name: "admin-stats", limit: 60, windowMs: 60_000 } }, async ({ auth }) => {
    const stats = await adminStats();
    const recentOrders = await auth.db.select().from(cryptoOrders).orderBy(desc(cryptoOrders.createdAt)).limit(8);
    const recentAudit = await auth.db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(8);
    return Response.json({ stats, recentOrders, recentAudit });
  });
}
