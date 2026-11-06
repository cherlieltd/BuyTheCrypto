import "server-only";
import { getTransakOrder } from "@/lib/transak/client";
import { shouldApplyStatus } from "@/lib/orders/status";
import { createDrizzleOrderRepository } from "@/lib/orders/store";

export async function syncOrderFromProvider(orderId: string) {
  const repository = createDrizzleOrderRepository();
  const order = await repository.findOrderById(orderId);
  if (!order?.providerOrderId) return order;

  const remote = await getTransakOrder(order.providerOrderId);
  const status = typeof remote.status === "string" ? remote.status : "";
  const cryptoAmount = typeof remote.cryptoAmount === "number" ? String(remote.cryptoAmount) : order.cryptoAmount;
  const fiatAmount = typeof remote.fiatAmount === "number" ? String(remote.fiatAmount) : order.fiatAmount;

  if (!status || !shouldApplyStatus(order.status, status)) {
    return repository.updateOrder(order.id, {
      cryptoAmount,
      fiatAmount,
      providerReference: order.providerOrderId,
    });
  }

  return repository.updateOrder(order.id, {
    status,
    cryptoAmount,
    fiatAmount,
    fiatCurrency: typeof remote.fiatCurrency === "string" ? remote.fiatCurrency : order.fiatCurrency,
    cryptoCurrency: typeof remote.cryptoCurrency === "string" ? remote.cryptoCurrency : order.cryptoCurrency,
    blockchainNetwork: typeof remote.network === "string" ? remote.network : order.blockchainNetwork,
    walletAddress: typeof remote.walletAddress === "string" ? remote.walletAddress : order.walletAddress,
    providerReference: order.providerOrderId,
  });
}
