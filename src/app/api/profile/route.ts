import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { profileSchema } from "@/lib/validation/schemas";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  return handleApi(request, { access: "user", limit: { name: "profile", limit: 60, windowMs: 60_000 } }, async ({ auth }) => {
    return Response.json({
      profile: {
        id: auth.profile.id,
        fullName: auth.profile.fullName,
        email: auth.profile.email,
        avatarUrl: auth.profile.avatarUrl,
        roles: auth.roles,
        createdAt: auth.profile.createdAt.toISOString(),
      },
    });
  });
}

export async function PATCH(request: Request) {
  return handleApi(request, { access: "user", limit: { name: "profile-write", limit: 20, windowMs: 60_000 } }, async ({ auth }) => {
    const parsed = profileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid profile.");
    const [profile] = await auth.db
      .update(profiles)
      .set({ fullName: parsed.data.fullName, updatedAt: new Date() })
      .where(eq(profiles.id, auth.profile.id))
      .returning();
    return Response.json({ profile });
  });
}
