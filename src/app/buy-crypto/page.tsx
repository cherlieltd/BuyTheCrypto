import type { Metadata } from "next";
import { BuyCryptoForm } from "@/components/buy/buy-crypto-form";

export const metadata: Metadata = { title: "Buy crypto" };

export default async function BuyCryptoPage({
  searchParams,
}: {
  searchParams: Promise<{ crypto?: string; network?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Buy crypto</h1>
        <p className="mt-4 text-muted leading-7">
          Choose a supported asset, amount, and external wallet. Transak hosts the payment and any required identity verification. A widget event is not treated as a completed purchase.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-muted">
          <li>Sign in before checkout so the order can be associated with your account.</li>
          <li>The widget URL is created on the server and expires about five minutes after it is issued.</li>
          <li>Final pricing is confirmed by Transak during checkout.</li>
        </ul>
      </div>
      <BuyCryptoForm initialSymbol={params.crypto?.toUpperCase()} initialNetwork={params.network} />
    </main>
  );
}
