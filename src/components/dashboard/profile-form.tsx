"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [name, setName] = useState(fullName);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-6 grid max-w-md gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fullName: name }),
        });
        const body = await response.json();
        setMessage(response.ok ? "Profile saved." : body.error?.message ?? "Profile could not be saved.");
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      <Button type="submit">Save profile</Button>
    </form>
  );
}
