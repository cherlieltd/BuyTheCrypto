import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { serializeOrder } from "@/app/api/orders/route";
import { cryptoOrders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { assertOrderAccess } from "@/lib/orders/access";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(request, { access: "user", limit: { name: "order", limit: 60, windowMs: 60_000 } }, async ({ auth }) => {
    const { id } = await context.params;
    const rows = await auth.db
      .select()
      .from(cryptoOrders)
      .where(and(eq(cryptoOrders.id, id), eq(cryptoOrders.userId, auth.profile.id)))
      .limit(1);
    const order = rows[0];
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");
    assertOrderAccess(order.userId, auth.profile.id, auth.roles.includes("admin"));
    return Response.json({ order: serializeOrder(order) });
  });
}
