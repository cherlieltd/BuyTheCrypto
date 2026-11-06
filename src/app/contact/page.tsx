import type { Metadata } from "next";
import { SupportForm } from "@/components/support/support-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Contact</h1>
      <p className="mt-4 text-base leading-8 text-muted">
        Questions about a payment or identity check should also be raised with Transak, because BuyTheCrypto does not process the payment. This form stores a support ticket when the database is configured.
      </p>
      <Card className="mt-8">
        <CardContent>
          <SupportForm />
        </CardContent>
      </Card>
    </main>
  );
}
