import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { supportSchema } from "@/lib/validation/schemas";
import { supportTickets } from "@/db/schema";
import { getAuthUser, getProfileForAuthUser } from "@/lib/auth";
import { getDb } from "@/db";

export async function POST(request: Request) {
  return handleApi(request, { access: "public", limit: { name: "support", limit: 8, windowMs: 60_000 } }, async () => {
    const parsed = supportSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the support form.");
    const db = getDb();
    if (!db) throw new ApiError(503, "DATABASE_NOT_CONFIGURED", "Support tickets require DATABASE_URL.");

    const user = await getAuthUser();
    const profile = user ? await getProfileForAuthUser(user.id) : null;
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: profile?.id ?? null,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: "open",
      })
      .returning();

    if (process.env.RESEND_API_KEY && process.env.SUPPORT_EMAIL_TO && process.env.SUPPORT_EMAIL_FROM) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.SUPPORT_EMAIL_FROM,
        to: process.env.SUPPORT_EMAIL_TO,
        replyTo: parsed.data.email,
        subject: `[BuyTheCrypto] ${parsed.data.subject}`,
        text: parsed.data.message,
      });
    }

    return Response.json({ id: ticket?.id, status: "open" }, { status: 201 });
  });
}
