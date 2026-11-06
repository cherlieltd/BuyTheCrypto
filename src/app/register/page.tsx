import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
