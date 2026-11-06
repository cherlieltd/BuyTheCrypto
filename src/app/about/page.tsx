import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">About</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">About BuyTheCrypto</h1>
          <p className="mt-5 text-base leading-8 text-muted">
            BuyTheCrypto is a non-custodial cryptocurrency purchasing platform. Version 1 focuses on market information and fiat-to-crypto purchases through Transak.
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            The product is built so additional on-ramp providers can be added behind the same purchase flow later. It does not currently offer custody, a proprietary exchange, or an embedded wallet.
          </p>
          <p className="mt-4 text-base leading-8 text-muted">
            Production use requires a Transak partner account, KYB approval for production keys and webhooks, and your own review of the legal pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/buy-crypto">Buy Crypto</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image src="/images/product-overview.jpg" alt="BuyTheCrypto product overview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" />
        </div>
      </div>
    </main>
  );
}
