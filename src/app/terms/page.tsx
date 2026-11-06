import type { Metadata } from "next";
import { Article } from "@/components/site/article";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <Article title="Terms of use">
      <p>These terms are a starting point for BuyTheCrypto version 1 and should be reviewed by counsel before production launch.</p>
      <p>BuyTheCrypto provides an interface to browse market data and to start a purchase with Transak. Transak, not BuyTheCrypto, provides the payment service, identity checks, and cryptocurrency delivery.</p>
      <p>You are responsible for the wallet address you submit. Transactions sent to an incorrect address may be unrecoverable.</p>
      <p>Market data is provided for information. It can be delayed or cached, and it is always shown with a timestamp.</p>
      <p>Accounts may be suspended for abuse, fraud, or unlawful use. Nothing on this site is an offer to users in a location where the service is not available.</p>
    </Article>
  );
}
