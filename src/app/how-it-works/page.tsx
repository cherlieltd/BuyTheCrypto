import type { Metadata } from "next";
import { Article } from "@/components/site/article";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <Article title="How it works">
      <p>BuyTheCrypto helps you review market prices and start a cryptocurrency purchase. Transak is the on-ramp that handles payment, identity verification when required, and delivery to your external wallet.</p>
      <p>1. Create an account and review the asset, network, fiat currency, and amount.</p>
      <p>2. Enter a compatible wallet address that you control. The address is checked with viem for EVM networks and with Transak&apos;s wallet verification endpoint.</p>
      <p>3. The server creates a single-use Transak widget URL. You complete checkout inside that widget.</p>
      <p>4. Transak sends an authenticated webhook. BuyTheCrypto verifies the signature, stores a minimized event, and updates the order if the new status is later in the lifecycle.</p>
      <p>Browser callbacks can link a Transak order id to your account. They cannot mark the purchase completed on their own.</p>
    </Article>
  );
}
