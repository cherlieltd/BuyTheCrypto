import { Clock3 } from "lucide-react";
import { Reveal } from "@/components/home/reveal";

export type PaymentMethodItem = {
  id: string;
  name: string;
  processingTime?: string;
};

function paymentVisual(method: PaymentMethodItem) {
  const key = `${method.id} ${method.name}`.toLowerCase();
  if (key.includes("apple")) {
    return { src: "/images/payments/apple-pay.svg", tone: "from-slate-900 to-slate-700", label: "Apple Pay" };
  }
  if (key.includes("google")) {
    return { src: "/images/payments/google-pay.svg", tone: "from-white to-slate-50", label: "Google Pay" };
  }
  if (key.includes("wire")) {
    return { src: "/images/payments/wire.svg", tone: "from-emerald-50 to-teal-50", label: "Wire" };
  }
  if (key.includes("bank") || key.includes("sepa") || key.includes("iban") || key.includes("ach") || key.includes("open_banking")) {
    return { src: "/images/payments/bank.svg", tone: "from-blue-50 to-indigo-50", label: "Bank" };
  }
  if (key.includes("card") || key.includes("credit") || key.includes("debit") || key.includes("visa") || key.includes("master")) {
    return { src: "/images/payments/card.svg", tone: "from-blue-600 to-indigo-500", label: "Card" };
  }
  return { src: "/images/payments/generic.svg", tone: "from-slate-100 to-slate-50", label: "Payment" };
}

export function PaymentMethodsSection({
  configured,
  methods,
}: {
  configured: boolean;
  methods: PaymentMethodItem[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Checkout options</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Supported payment methods</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Methods are shown from the current Transak fiat coverage response. Availability still depends on your location, the asset, and Transak&apos;s review at checkout.
          </p>
        </div>
      </Reveal>

      {!configured ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted">
          Payment methods appear here after the Transak partner API key is configured. They are not listed from a static catalog.
        </p>
      ) : methods.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Transak did not return active payment methods just now.</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((method, index) => {
            const visual = paymentVisual(method);
            return (
              <Reveal key={method.id} delay={Math.min(index * 0.04, 0.2)}>
                <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_16px_40px_rgba(55,114,255,0.12)]">
                  <div className="flex items-start gap-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${visual.tone} shadow-sm ring-1 ring-black/5`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={visual.src} alt="" width={40} height={40} className="h-10 w-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-base font-semibold text-foreground">{method.name}</h3>
                        <span className="rounded-lg bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {visual.label}
                        </span>
                      </div>
                      {method.processingTime ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-accent">
                          <Clock3 className="h-3.5 w-3.5" />
                          {method.processingTime}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-muted">Processed by Transak at checkout</p>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
