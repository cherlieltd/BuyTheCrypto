"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusLabel, statusTone } from "@/lib/orders/status";

type Order = { id: string; status: string; cryptoCurrency: string; fiatAmount: number; fiatCurrency: string; providerOrderId: string | null };

export function OrderAdmin({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState<string | null>(null);

  async function reconcile(orderId: string) {
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const body = await response.json();
    setMessage(body.notice ?? body.error?.message ?? "Reconciliation finished.");
    if (response.ok && body.order?.status) {
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: body.order.status } : order)));
    }
  }

  return (
    <div>
      {message ? <p className="mb-4 text-sm text-muted">{message}</p> : null}
      <div className="mb-4">
        <a className="text-sm text-emerald-300" href="/api/admin/orders?format=csv">
          Export CSV
        </a>
      </div>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {order.fiatAmount} {order.fiatCurrency} · {order.cryptoCurrency}
              </p>
              <p className="text-xs text-muted">{order.providerOrderId ?? "No Transak order id yet"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => reconcile(order.id)}>
                Refresh from Transak
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
