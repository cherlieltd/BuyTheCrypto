import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  {
    title: "Review the market",
    body: "Create an account and review the asset, network, fiat currency, and amount using CoinGecko market context.",
  },
  {
    title: "Enter your wallet",
    body: "Provide a compatible wallet address that you control. EVM addresses are checked with viem and Transak’s verification endpoint.",
  },
  {
    title: "Checkout with Transak",
    body: "The server creates a single-use Transak widget URL. You complete payment and any required identity checks inside that widget.",
  },
  {
    title: "Track the confirmed status",
    body: "Transak sends an authenticated webhook. BuyTheCrypto verifies the signature and updates the order only when the new status is later in the lifecycle.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Process</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">How it works</h1>
        <p className="mt-4 text-base leading-8 text-muted">
          BuyTheCrypto helps you review market prices and start a cryptocurrency purchase. Transak is the on-ramp that handles payment, identity verification when required, and delivery to your external wallet.
        </p>
      </div>
      <div className="relative mt-10 aspect-[16/7] overflow-hidden rounded-[2rem]">
        <Image src="/images/steps-buythecrypto.jpg" alt="Illustrated purchase steps" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1100px" />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
            <h2 className="mt-3 font-display text-xl font-semibold">{step.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 max-w-3xl text-sm leading-7 text-muted">
        Browser callbacks can link a Transak order id to your account. They cannot mark the purchase completed on their own.
      </p>
      <Button asChild className="mt-8" size="lg">
        <Link href="/buy-crypto">Start a purchase</Link>
      </Button>
    </main>
  );
}
