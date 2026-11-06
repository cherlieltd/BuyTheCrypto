import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { supportTickets } from "@/db/schema";
import { SupportAdmin } from "@/components/admin/support-admin";

export default async function AdminSupportPage() {
  const auth = await requireAdmin();
  const tickets = await auth.db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(100);
  return (
    <main>
      <h1 className="text-3xl font-semibold">Support tickets</h1>
      <div className="mt-6">
        <SupportAdmin tickets={tickets} />
      </div>
    </main>
  );
}
