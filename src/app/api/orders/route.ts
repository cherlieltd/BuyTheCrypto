import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { createDrizzleOrderRepository } from "@/lib/orders/store";
import { syncOrderFromProvider } from "@/lib/orders/sync";
import { listOrdersForUser } from "@/lib/auth";
import { cryptoOrders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { assertOrderAccess } from "@/lib/orders/access";
import { clientOrderUpdateSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  return handleApi(request, { access: "user", limit: { name: "orders", limit: 60, windowMs: 60_000 } }, async ({ auth }) => {
    const orders = await listOrdersForUser(auth.profile.id);
    return Response.json({
      orders: orders.map(serializeOrder),
      notice: "Completed purchases are shown only after Transak confirms them.",
    });
  });
}

export async function POST(request: Request) {
  return handleApi(
    request,
    { access: "user", limit: { name: "order-reconcile", limit: 20, windowMs: 60_000 } },
    async ({ auth }) => {
      const parsed = clientOrderUpdateSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) throw new ApiError(400, "INVALID_INPUT", "A valid order id is required.");

      const repository = createDrizzleOrderRepository();
      const order = await repository.findOrderById(parsed.data.orderId);
      if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found.");
      assertOrderAccess(order.userId, auth.profile.id, auth.roles.includes("admin"));

      if (parsed.data.providerOrderId && !order.providerOrderId) {
        await auth.db
          .update(cryptoOrders)
          .set({ providerOrderId: parsed.data.providerOrderId, updatedAt: new Date() })
          .where(and(eq(cryptoOrders.id, order.id), eq(cryptoOrders.userId, auth.profile.id)));
      }

      const current = await repository.findOrderById(order.id);
      if (!current?.providerOrderId) {
        return Response.json({
          order: current ? serializeStored(current) : null,
          confirmed: false,
          notice: "Transak has not confirmed an order id yet. Payment status will update from the webhook.",
        });
      }

      const synced = await syncOrderFromProvider(order.id);
      return Response.json({
        order: synced ? serializeStored(synced) : null,
        confirmed: true,
        notice: "Status was refreshed from the Transak order API.",
      });
    },
  );
}

export function serializeOrder(order: {
  id: string;
  provider: string;
  providerOrderId: string | null;
  fiatCurrency: string;
  fiatAmount: unknown;
  cryptoCurrency: string;
  cryptoAmount: unknown;
  blockchainNetwork: string;
  walletAddress: string;
  status: string;
  providerReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: order.id,
    provider: order.provider,
    providerOrderId: order.providerOrderId,
    fiatCurrency: order.fiatCurrency,
    fiatAmount: Number(order.fiatAmount),
    cryptoCurrency: order.cryptoCurrency,
    cryptoAmount: order.cryptoAmount == null ? null : Number(order.cryptoAmount),
    blockchainNetwork: order.blockchainNetwork,
    walletAddress: order.walletAddress,
    status: order.status,
    providerReference: order.providerReference,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function serializeStored(order: {
  id: string;
  provider: string;
  providerOrderId: string | null;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoCurrency: string;
  cryptoAmount: string | null;
  blockchainNetwork: string;
  walletAddress: string;
  status: string;
  providerReference: string | null;
}) {
  return {
    ...order,
    fiatAmount: Number(order.fiatAmount),
    cryptoAmount: order.cryptoAmount == null ? null : Number(order.cryptoAmount),
  };
}
