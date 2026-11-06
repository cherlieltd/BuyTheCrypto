import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock3, ShieldCheck, Wallet } from "lucide-react";
import { BuyCryptoForm } from "@/components/buy/buy-crypto-form";
import { Reveal } from "@/components/home/reveal";
import { Sparkline } from "@/components/markets/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedMarkets, getMarketOverview } from "@/lib/markets/coingecko";
import { transakConfig } from "@/lib/transak/config";
import { getFiatCurrencies } from "@/lib/transak/client";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";

const steps = [
  ["Choose an asset", "Browse CoinGecko market prices, then pick a cryptocurrency and network Transak currently supports."],
  ["Enter your wallet", "Provide an external wallet address you control. BuyTheCrypto never asks for a seed phrase or private key."],
  ["Finish with Transak", "Pay and complete any required identity checks inside Transak. Status updates after Transak confirms it."],
];

const trust = [
  ["Transak checkout", "Payment and KYC stay with Transak"],
  ["External wallet", "Crypto is sent to an address you provide"],
  ["Timestamped markets", "CoinGecko prices always show when they were retrieved"],
];

const facts = [
  "BuyTheCrypto does not hold fiat, cryptocurrency, card details, or private keys.",
  "Identity verification, when required, is completed with Transak.",
  "Signed-in customers can review only the orders associated with their account.",
];

async function paymentMethods() {
  if (!transakConfig().configured) return { configured: false, methods: [] as Array<{ id: string; name: string; processingTime?: string }> };
  try {
    const raw = (await getFiatCurrencies()) as Array<{
      isAllowed?: boolean;
      paymentOptions?: Array<{ id?: string; name?: string; isActive?: boolean; processingTime?: string }>;
    }>;
    const methods = new Map<string, { id: string; name: string; processingTime?: string }>();
    for (const fiat of raw) {
      if (fiat.isAllowed === false) continue;
      for (const option of fiat.paymentOptions ?? []) {
        if (!option.id || !option.name || option.isActive === false) continue;
        methods.set(option.id, { id: option.id, name: option.name, processingTime: option.processingTime });
      }
    }
    return { configured: true, methods: [...methods.values()] };
  } catch {
    return { configured: true, methods: [], error: true };
  }
}

export default async function HomePage() {
  const [featured, markets, payments] = await Promise.all([
    getFeaturedMarkets("usd").catch(() => null),
    getMarketOverview("usd").catch(() => null),
    paymentMethods(),
  ]);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(55,114,255,0.16),transparent_42%),linear-gradient(#f7f8fc,#eef2ff)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <Reveal immediate>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">BuyTheCrypto</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
              Buy crypto simply and securely
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
              Explore market prices, send crypto to your own wallet, and complete checkout with Transak.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="outline">
                <Link href="/markets">Explore Markets</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal immediate delay={0.08}>
            <BuyCryptoForm />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
          {trust.map(([title, body]) => (
            <div key={title} className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="markets-heading">
        <Reveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="markets-heading" className="font-display text-3xl font-semibold tracking-tight">
                Market overview
              </h2>
              <p className="mt-2 text-sm text-muted">
                {featured
                  ? `${featured.stale ? "Cached market data" : "Market data"} updated ${formatTimestamp(featured.updatedAt)} via CoinGecko. Quoted in USD.`
                  : "Market data is temporarily unavailable."}
              </p>
            </div>
            <Link href="/markets" className="hidden text-sm font-semibold text-accent sm:inline">
              View markets
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(featured?.coins ?? []).map((coin, index) => (
            <Reveal key={coin.id} delay={index * 0.05}>
              <Link href={`/crypto/${coin.id}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-accent/30">
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {coin.image ? (
                          <Image src={coin.image} alt="" width={36} height={36} className="rounded-full" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-semibold">{coin.symbol.slice(0, 3)}</span>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{coin.name}</p>
                          <p className="text-xs uppercase text-muted">{coin.symbol}</p>
                        </div>
                      </div>
                      <Sparkline prices={coin.sparkline} width={72} height={32} />
                    </div>
                    <p className="mt-5 text-2xl font-semibold tracking-tight">{formatFiat(coin.price, "USD")}</p>
                    <Badge className="mt-3" tone={coin.change24h != null && coin.change24h < 0 ? "danger" : "success"}>
                      {coin.change24h == null ? "24h unavailable" : `${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Market update</h2>
                <p className="mt-2 text-sm text-muted">
                  {markets
                    ? `${markets.stale ? "Cached" : "Latest"} CoinGecko ranking with 7-day sparkline context.`
                    : "Market table unavailable right now."}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/markets">Open markets</Link>
              </Button>
            </div>
          </Reveal>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Last price</th>
                  <th className="px-4 py-3 font-medium">24h %</th>
                  <th className="px-4 py-3 font-medium">Market cap</th>
                  <th className="px-4 py-3 font-medium">Last 7 days</th>
                </tr>
              </thead>
              <tbody>
                {(markets?.coins ?? []).slice(0, 10).map((coin, index) => (
                  <tr key={coin.id} className="border-t border-border">
                    <td className="px-4 py-4 text-muted">{index + 1}</td>
                    <td className="px-4 py-4">
                      <Link href={`/crypto/${coin.id}`} className="flex items-center gap-3 font-medium hover:text-accent">
                        {coin.image ? <Image src={coin.image} alt="" width={28} height={28} className="rounded-full" /> : null}
                        <span>
                          {coin.name} <span className="text-muted">{coin.symbol}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">{formatFiat(coin.price, "USD")}</td>
                    <td className={`px-4 py-4 font-medium ${coin.change24h != null && coin.change24h < 0 ? "text-danger" : "text-success"}`}>
                      {coin.change24h == null ? "—" : `${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-4">{formatCompact(coin.marketCap)}</td>
                    <td className="px-4 py-4">
                      <Sparkline prices={coin.sparkline ?? []} width={96} height={28} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">How buying crypto works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">Three clear steps from market price to an external wallet delivery through Transak.</p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="relative mx-auto mt-10 aspect-[16/7] max-w-4xl overflow-hidden rounded-[2rem]">
            <Image src="/images/steps-buythecrypto.jpg" alt="Illustrated buying steps for asset, wallet, and checkout" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(([title, body], index) => (
            <Reveal key={title} delay={index * 0.05}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
                <h3 className="mt-3 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-surface/70 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
              <Image src="/images/product-overview.jpg" alt="BuyTheCrypto product overview on a laptop screen" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">What is BuyTheCrypto</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Non-custodial crypto purchases for your own wallet</h2>
            <ul className="mt-6 space-y-4">
              {facts.map((fact) => (
                <li key={fact} className="flex gap-3 text-sm leading-7 text-muted">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/about">Know more</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Supported payment methods</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Methods are shown from the current Transak fiat coverage response. Availability still depends on your location, the asset, and Transak&apos;s review at checkout.
          </p>
        </Reveal>
        {!payments.configured ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted">
            Payment methods appear here after the Transak partner API key is configured. They are not listed from a static catalog.
          </p>
        ) : payments.methods.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Transak did not return active payment methods just now.</p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payments.methods.map((method) => (
              <div key={method.id} className="rounded-2xl border border-border bg-card px-4 py-4">
                <p className="font-medium text-foreground">{method.name}</p>
                {method.processingTime ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Clock3 className="h-3.5 w-3.5" />
                    {method.processingTime}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-accent px-8 py-12 text-accent-foreground sm:px-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Ready to buy crypto into your wallet?</h2>
                <p className="mt-3 max-w-2xl text-blue-50">
                  Create an account to track orders, or go straight to checkout and complete payment with Transak.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-card text-foreground hover:bg-white">
                  <Link href="/register">Create account</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  <Link href="/buy-crypto">Buy Crypto</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-7 text-muted">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-semibold text-foreground">Security and risk disclosures</p>
              <p className="mt-2">Cryptocurrency prices can change quickly, and a purchase can fail, expire, or be refunded by the payment partner.</p>
              <p className="mt-2">BuyTheCrypto is not a bank, exchange custodian, or wallet provider.</p>
              <Link href="/risk-disclosure" className="mt-3 inline-block font-semibold text-accent">
                Read the risk disclosure
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
