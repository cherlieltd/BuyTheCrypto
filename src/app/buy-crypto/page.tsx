import type { Metadata } from "next";
import Image from "next/image";
import { BuyCryptoForm } from "@/components/buy/buy-crypto-form";

export const metadata: Metadata = { title: "Buy crypto" };

export default async function BuyCryptoPage({
  searchParams,
}: {
  searchParams: Promise<{ crypto?: string; network?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Checkout</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Buy crypto</h1>
        <p className="mt-4 text-base leading-8 text-muted">
          Choose a supported asset, amount, and external wallet. Transak hosts the payment and any required identity verification. A widget event is not treated as a completed purchase.
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
          <li>Sign in before checkout so the order can be associated with your account.</li>
          <li>The widget URL is created on the server and expires about five minutes after it is issued.</li>
          <li>Final pricing is confirmed by Transak during checkout.</li>
        </ul>
        <div className="relative mt-10 hidden aspect-[16/10] overflow-hidden rounded-[1.75rem] lg:block">
          <Image src="/images/hero-buythecrypto.jpg" alt="" fill className="object-cover" sizes="480px" />
        </div>
      </div>
      <BuyCryptoForm initialSymbol={params.crypto?.toUpperCase()} initialNetwork={params.network} />
    </main>
  );
}
