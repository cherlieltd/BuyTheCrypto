"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Ticket = { id: string; email: string; subject: string; message: string; status: string };

export function SupportAdmin({ tickets }: { tickets: Ticket[] }) {
  const [items, setItems] = useState(tickets);

  async function close(id: string) {
    const response = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status: "closed" }),
    });
    if (response.ok) setItems((current) => current.map((ticket) => (ticket.id === id ? { ...ticket, status: "closed" } : ticket)));
  }

  return (
    <ul className="space-y-3">
      {items.map((ticket) => (
        <li key={ticket.id} className="rounded-2xl border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{ticket.subject}</p>
              <p className="text-xs text-muted">{ticket.email} · {ticket.status}</p>
              <p className="mt-2 text-sm text-muted">{ticket.message}</p>
            </div>
            {ticket.status === "open" ? (
              <Button size="sm" variant="outline" onClick={() => close(ticket.id)}>
                Close
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
