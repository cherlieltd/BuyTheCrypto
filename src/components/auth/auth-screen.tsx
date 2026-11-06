"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

type Mode = "login" | "register" | "forgot";

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [message, setMessage] = useState<string | null>(null);
  const schema = mode === "register" ? registerSchema : mode === "login" ? loginSchema : loginSchema.pick({ email: true });
  const form = useForm({ defaultValues: { fullName: "", email: "", password: "" } });

  async function onSubmit(values: { fullName: string; email: string; password: string }) {
    setMessage(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured. Add the project URL and publishable key.");
      return;
    }
    const origin = window.location.origin;
    if (mode === "register") {
      const registration = registerSchema.parse(values);
      const { error } = await supabase.auth.signUp({
        email: registration.email,
        password: registration.password,
        options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, data: { full_name: registration.fullName } },
      });
      setMessage(error ? error.message : "Check your email to verify the account, then sign in.");
      return;
    }
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${origin}/auth/callback?next=/dashboard/settings` });
      setMessage(error ? error.message : "If an account exists, a reset email is on the way.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function google() {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setMessage(error.message);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">BuyTheCrypto</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {mode === "register" ? "Create account" : mode === "forgot" ? "Reset password" : "Log in"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted">Email verification and Google sign-in are handled by Supabase Auth.</p>
          <form className="mt-8 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "register" ? (
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...form.register("fullName")} />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            </div>
            {mode !== "forgot" ? (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} />
              </div>
            ) : null}
            {message ? <p className="text-sm text-warning">{message}</p> : null}
            <Button type="submit">{mode === "register" ? "Create account" : mode === "forgot" ? "Send reset email" : "Log in"}</Button>
          </form>
          {mode !== "forgot" ? (
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={google}>
              Continue with Google
            </Button>
          ) : null}
          <div className="mt-6 flex justify-between text-sm text-muted">
            <Link href={mode === "login" ? "/register" : "/login"} className="hover:text-accent">
              {mode === "login" ? "Create an account" : "Have an account? Log in"}
            </Link>
            <Link href="/forgot-password" className="hover:text-accent">
              Forgot password
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
