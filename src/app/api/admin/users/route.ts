import { handleApi } from "@/lib/api";
import { searchUsers, writeAuditLog } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { roleSchema } from "@/lib/validation/schemas";
import { userRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  return handleApi(request, { access: "admin", limit: { name: "admin-users", limit: 60, windowMs: 60_000 } }, async () => {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const users = await searchUsers(query);
    return Response.json({ users });
  });
}

export async function PATCH(request: Request) {
  return handleApi(request, { access: "admin", limit: { name: "admin-roles", limit: 20, windowMs: 60_000 } }, async ({ auth }) => {
    const body = (await request.json().catch(() => null)) as { userId?: string } | null;
    const parsed = roleSchema.safeParse(body);
    if (!body?.userId || !parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "A user id and role are required.");
    }
    if (body.userId === auth.profile.id && parsed.data.role === "admin" && !parsed.data.enabled) {
      throw new ApiError(400, "INVALID_INPUT", "You cannot remove your own administrator role.");
    }

    if (parsed.data.enabled) {
      await auth.db.insert(userRoles).values({ userId: body.userId, role: parsed.data.role }).onConflictDoNothing();
    } else {
      await auth.db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, body.userId), eq(userRoles.role, parsed.data.role)));
    }

    await writeAuditLog({
      adminUserId: auth.profile.id,
      action: parsed.data.enabled ? "role.grant" : "role.revoke",
      targetType: "user",
      targetId: body.userId,
    });

    return Response.json({ ok: true });
  });
}
