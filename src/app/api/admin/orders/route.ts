import { handleApi } from "@/lib/api";
import { searchAdminOrders } from "@/lib/orders/store";
import { serializeOrder } from "@/app/api/orders/route";
import { syncOrderFromProvider } from "@/lib/orders/sync";
import { writeAuditLog } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { createDrizzleOrderRepository } from "@/lib/orders/store";

export async function GET(request: Request) {
  return handleApi(request, { access: "admin", limit: { name: "admin-orders", limit: 60, windowMs: 60_000 } }, async () => {
    const url = new URL(request.url);
    const orders = await searchAdminOrders({
      query: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    if (url.searchParams.get("format") === "csv") {
      const header = "id,status,fiat_currency,fiat_amount,crypto_currency,crypto_amount,network,provider_order_id,created_at";
      const lines = orders.map((order) =>
        [
          order.id,
          order.status,
          order.fiatCurrency,
          order.fiatAmount,
          order.cryptoCurrency,
          order.cryptoAmount ?? "",
          order.blockchainNetwork,
          order.providerOrderId ?? "",
          order.createdAt.toISOString(),
        ].join(","),
      );
      return new Response([header, ...lines].join("\n"), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=orders.csv",
        },
      });
    }
    return Response.json({ orders: orders.map(serializeOrder) });
  });
}

export async function POST(request: Request) {
  return handleApi(
    request,
    { access: "admin", limit: { name: "admin-reconcile", limit: 20, windowMs: 60_000 } },
    async ({ auth }) => {
      const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
      if (!body?.orderId) throw new ApiError(400, "INVALID_INPUT", "An order id is required.");
      const existing = await createDrizzleOrderRepository().findOrderById(body.orderId);
      if (!existing) throw new ApiError(404, "NOT_FOUND", "Order not found.");
      if (!existing.providerOrderId) {
        throw new ApiError(409, "NOT_CONFIRMED", "Transak has not issued an order id for this checkout yet.");
      }
      const order = await syncOrderFromProvider(body.orderId);
      await writeAuditLog({
        adminUserId: auth.profile.id,
        action: "order.reconcile",
        targetType: "crypto_order",
        targetId: body.orderId,
      });
      return Response.json({
        order,
        notice: "Status was refreshed from Transak. This does not change the payment at Transak.",
      });
    },
  );
}
