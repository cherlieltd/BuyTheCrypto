import { desc, eq } from "drizzle-orm";
import { handleApi } from "@/lib/api";
import { supportTickets } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/auth";

export async function GET(request: Request) {
  return handleApi(request, { access: "admin", limit: { name: "admin-support", limit: 60, windowMs: 60_000 } }, async ({ auth }) => {
    const tickets = await auth.db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(100);
    return Response.json({ tickets });
  });
}

export async function PATCH(request: Request) {
  return handleApi(
    request,
    { access: "admin", limit: { name: "admin-support-write", limit: 30, windowMs: 60_000 } },
    async ({ auth }) => {
      const body = (await request.json().catch(() => null)) as { id?: string; status?: string } | null;
      if (!body?.id || (body.status !== "open" && body.status !== "closed")) {
        throw new ApiError(400, "INVALID_INPUT", "A ticket id and status are required.");
      }
      await auth.db.update(supportTickets).set({ status: body.status }).where(eq(supportTickets.id, body.id));
      await writeAuditLog({
        adminUserId: auth.profile.id,
        action: "support.status",
        targetType: "support_ticket",
        targetId: body.id,
      });
      return Response.json({ ok: true });
    },
  );
}
