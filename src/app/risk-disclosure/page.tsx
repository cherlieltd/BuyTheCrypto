import type { Metadata } from "next";
import { Article } from "@/components/site/article";

export const metadata: Metadata = { title: "Risk disclosure" };

export default function RiskPage() {
  return (
    <Article title="Risk disclosure">
      <p>Cryptocurrency prices are volatile. The value of an asset can fall sharply, including to zero. Past prices shown on this site do not predict future prices.</p>
      <p>A purchase can be declined, delayed, cancelled, expired, or refunded by Transak or by a payment provider. Network delivery depends on the blockchain and on Transak&apos;s process.</p>
      <p>BuyTheCrypto does not guarantee transaction speed, pricing, availability, or that a jurisdiction will remain supported.</p>
      <p>You can lose funds by sending cryptocurrency to an incompatible address or by losing access to the wallet that controls that address.</p>
      <p>This site does not provide investment, tax, or legal advice.</p>
    </Article>
  );
}
