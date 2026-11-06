"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supportSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { z } from "zod";

type Values = z.infer<typeof supportSchema>;

export function SupportForm() {
  const [status, setStatus] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(supportSchema) });

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        setStatus(null);
        const response = await fetch("/api/support", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });
        const body = await response.json();
        setStatus(response.ok ? "Your message was received." : body.error?.message ?? "The message could not be sent.");
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...form.register("subject")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" {...form.register("message")} />
      </div>
      {status ? <p className="text-sm text-emerald-200">{status}</p> : null}
      <Button type="submit">Send message</Button>
    </form>
  );
}
