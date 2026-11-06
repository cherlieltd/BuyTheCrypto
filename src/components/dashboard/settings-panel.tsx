"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SettingsPanel({ email }: { email: string }) {
  const router = useRouter();
  return (
    <div className="mt-6 space-y-4 text-sm text-muted">
      <p>Signed in as {email}.</p>
      <p>Password resets are emailed by Supabase. Google accounts are managed with Google.</p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={async () => {
            const supabase = createClient();
            if (!supabase) return;
            await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
            });
            alert("If email delivery is configured in Supabase, a reset message has been sent.");
          }}
        >
          Email password reset
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            const supabase = createClient();
            if (!supabase) return;
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
