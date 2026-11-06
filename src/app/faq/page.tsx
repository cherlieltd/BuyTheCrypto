import type { Metadata } from "next";
import { getPublishedFaqs } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  const items = await getPublishedFaqs();
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 text-base leading-8 text-muted">Clear answers about checkout, wallets, and how order status is confirmed.</p>
      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <summary className="cursor-pointer font-display font-semibold text-foreground">{item.question}</summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
