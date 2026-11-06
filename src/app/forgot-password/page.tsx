import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <AuthScreen mode="forgot" />
    </Suspense>
  );
}
