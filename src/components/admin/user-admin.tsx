"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRow = { id: string; email: string; fullName: string | null; roles: string[] };

export function UserAdmin({ initialUsers }: { initialUsers: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const body = await response.json();
    if (response.ok) setUsers(body.users);
  }

  async function setRole(userId: string, role: "admin" | "customer", enabled: boolean) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role, enabled }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Role updated." : body.error?.message ?? "Role could not be updated.");
  }

  return (
    <div>
      <form className="flex gap-2" onSubmit={search}>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" aria-label="Search users" />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
      <ul className="mt-6 space-y-3">
        {users.map((user) => (
          <li key={user.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium">{user.fullName || "Unnamed"}</p>
            <p className="text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">Roles: {(user.roles ?? []).filter(Boolean).join(", ") || "none"}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setRole(user.id, "admin", true)}>
                Grant admin
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={() => setRole(user.id, "admin", false)}>
                Revoke admin
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
