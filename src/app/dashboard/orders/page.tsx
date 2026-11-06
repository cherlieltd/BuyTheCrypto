import { listOrdersForUser, requireUser } from "@/lib/auth";
import { statusLabel, statusTone } from "@/lib/orders/status";
import { Badge } from "@/components/ui/badge";
import { formatFiat, formatTimestamp, shortAddress } from "@/lib/utils";

export default async function OrdersPage() {
  const auth = await requireUser();
  const orders = await listOrdersForUser(auth.profile.id);
  return (
    <main>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="mt-2 text-sm text-muted">A checkout that was opened is not a completed purchase until Transak reports a later status.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-3">Created</th>
              <th>Asset</th>
              <th>Amount</th>
              <th>Wallet</th>
              <th>Status</th>
              <th>Transak reference</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10">
                <td className="py-4">{formatTimestamp(order.createdAt)}</td>
                <td>
                  {order.cryptoCurrency}
                  <div className="text-xs text-muted">{order.blockchainNetwork}</div>
                </td>
                <td>
                  {formatFiat(Number(order.fiatAmount), order.fiatCurrency)}
                  <div className="text-xs text-muted">{order.cryptoAmount ? `${order.cryptoAmount} ${order.cryptoCurrency}` : "Amount confirmed by Transak"}</div>
                </td>
                <td>{shortAddress(order.walletAddress)}</td>
                <td>
                  <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                </td>
                <td className="text-xs text-muted">{order.providerOrderId ?? "Waiting for Transak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
