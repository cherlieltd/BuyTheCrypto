import type { Metadata } from "next";
import { getPublishedFaqs } from "@/lib/content";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  const items = await getPublishedFaqs();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-3xl border border-white/10 bg-card px-5 py-4">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
