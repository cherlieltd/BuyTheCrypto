import { JsonWebTokenError } from "jsonwebtoken";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { errorResponse, ApiError } from "@/lib/errors";
import { getWebhookVerificationTokens } from "@/lib/transak/client";
import { parseVerifiedWebhook, verifyTransakWebhookJwt } from "@/lib/transak/webhook";
import { reconcileTransakEvent } from "@/lib/orders/reconcile";
import { createDrizzleOrderRepository } from "@/lib/orders/store";
import { syncOrderFromProvider } from "@/lib/orders/sync";
import { inngest } from "@/inngest/client";
import { logError } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, { name: "transak-webhook", limit: 120, windowMs: 60_000 });
    const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
    if (!body || typeof body.data !== "string" || body.data.split(".").length !== 3) {
      throw new ApiError(400, "INVALID_WEBHOOK", "Transak webhooks must include a signed data JWT.");
    }

    const tokens = await getWebhookVerificationTokens();
    const claims = verifyTransakWebhookJwt(body.data, tokens);
    const event = parseVerifiedWebhook(body.data, claims);
    const result = await reconcileTransakEvent(createDrizzleOrderRepository(), event);

    if (result.order?.providerOrderId) {
      if (process.env.INNGEST_EVENT_KEY) {
        await inngest.send({
          name: "transak/order.reconcile",
          data: { orderId: result.order.id },
        });
      } else {
        await syncOrderFromProvider(result.order.id).catch((error: unknown) => {
          void logError("transak.reconcile", error, { orderId: result.order?.id });
        });
      }
    }

    return Response.json({
      received: true,
      duplicate: result.duplicate,
      applied: result.applied,
      ignoredReason: result.ignoredReason ?? null,
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError || (error instanceof Error && /invalid signature|jwt/i.test(error.message))) {
      return Response.json(
        { error: { code: "INVALID_SIGNATURE", message: "Webhook signature verification failed." } },
        { status: 401 },
      );
    }
    await logError("transak.webhook", error);
    return errorResponse(error);
  }
}
