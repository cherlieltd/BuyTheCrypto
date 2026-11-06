import type { Metadata } from "next";
import { Article } from "@/components/site/article";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Article title="Privacy">
      <p>BuyTheCrypto stores account details such as your name, email address, and the wallet address you submit for a purchase. It does not ask for card numbers, seed phrases, or private keys.</p>
      <p>Payment and identity information collected during checkout is handled by Transak under Transak&apos;s own privacy notice.</p>
      <p>Webhook records store a reduced order payload. Fields such as IP address, card data, and bank details are not kept in the stored webhook record.</p>
      <p>Authentication is provided by Supabase. Optional product analytics run only when a PostHog key is configured, and error reporting runs only when a Sentry DSN is configured.</p>
      <p>Have this notice reviewed for your operating regions before production.</p>
    </Article>
  );
}
