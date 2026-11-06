import type { Metadata } from "next";
import { Article } from "@/components/site/article";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Article title="About BuyTheCrypto">
      <p>BuyTheCrypto is a non-custodial cryptocurrency purchasing platform. Version 1 focuses on market information and fiat-to-crypto purchases through Transak.</p>
      <p>The product is built so additional on-ramp providers can be added behind the same purchase flow later. It does not currently offer custody, a proprietary exchange, or an embedded wallet.</p>
      <p>Production use requires a Transak partner account, KYB approval for production keys and webhooks, and your own review of the legal pages.</p>
    </Article>
  );
}
