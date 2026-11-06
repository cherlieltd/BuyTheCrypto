import Link from "next/link";
import { Reveal } from "@/components/home/reveal";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/markets/charts";
import { getFeaturedMarkets } from "@/lib/markets/coingecko";
import { transakConfig } from "@/lib/transak/config";
import { getFiatCurrencies } from "@/lib/transak/client";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";

const steps = [
  ["Choose an asset", "Browse market prices, then select a cryptocurrency and network that Transak currently supports."],
  ["Enter your wallet", "Provide an external wallet address you control. BuyTheCrypto never asks for a seed phrase or private key."],
  ["Finish with Transak", "Pay and complete any required identity checks inside Transak. Order status updates after Transak confirms it."],
];

const benefits = [
  ["Non-custodial checkout", "BuyTheCrypto does not hold fiat, cryptocurrency, card details, or private keys."],
  ["Partner-handled compliance", "Identity verification, when required, is completed with Transak."],
  ["Clear order history", "Signed-in customers can review the orders associated with their account."],
  ["Market context", "Prices, market cap, volume, and charts come from CoinGecko and always show a timestamp."],
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
  const [markets, payments] = await Promise.all([
    getFeaturedMarkets("usd").catch(() => null),
    paymentMethods(),
  ]);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
        <Reveal>
          <Badge tone="success">Transak on-ramp</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Buy Crypto Simply, Securely & Confidently
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Explore cryptocurrency markets and purchase supported digital assets through our integrated crypto payment partner.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/buy-crypto">
                Buy Crypto <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/markets">Explore Markets</Link>
            </Button>
          </div>
        </Reveal>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">External wallet checkout</p>
                <p className="text-sm text-muted">Crypto is sent to an address you provide.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted">
              <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
              Transak processes the payment and any required identity verification. BuyTheCrypto does not store card numbers or wallet private keys.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4" aria-labelledby="markets-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="markets-heading" className="text-2xl font-semibold">Live cryptocurrency market overview</h2>
            <p className="mt-2 text-sm text-muted">
              {markets
                ? `${markets.stale ? "Cached market data" : "Market data"} updated ${formatTimestamp(markets.updatedAt)} via CoinGecko. Quoted in USD.`
                : "Market data is temporarily unavailable."}
            </p>
          </div>
          <Link href="/markets" className="text-sm text-emerald-300">
            View markets
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(markets?.coins ?? []).map((coin) => (
            <Link key={coin.id} href={`/crypto/${coin.id}`}>
              <Card className="h-full transition hover:border-emerald-300/40">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted">{coin.name}</p>
                      <p className="mt-1 text-2xl font-semibold">{formatFiat(coin.price, "USD")}</p>
                    </div>
                    <Sparkline prices={coin.sparkline} />
                  </div>
                  <p className={`mt-4 text-sm ${coin.change24h != null && coin.change24h >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {coin.change24h == null ? "24h change unavailable" : `${coin.change24h.toFixed(2)}% 24h`}
                  </p>
                  <p className="mt-2 text-xs text-muted">Mkt cap {formatCompact(coin.marketCap)} · Vol {formatCompact(coin.volume24h)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <h2 className="text-2xl font-semibold">How buying crypto works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(([title, body], index) => (
            <Card key={title}>
              <CardContent>
                <p className="text-sm text-emerald-300">0{index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <h2 className="text-2xl font-semibold">Supported payment methods</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Methods are shown from the current Transak fiat coverage response. Availability still depends on your location, the asset, and Transak&apos;s review at checkout.
        </p>
        {!payments.configured ? (
          <p className="mt-6 rounded-3xl border border-dashed border-white/15 p-6 text-sm text-muted">
            Payment methods appear here after the Transak partner API key is configured. They are not listed from a static catalog.
          </p>
        ) : payments.methods.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Transak did not return active payment methods just now.</p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {payments.methods.map((method) => (
              <div key={method.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="font-medium">{method.name}</p>
                {method.processingTime ? <p className="mt-1 text-xs text-muted">{method.processingTime}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 md:grid-cols-2">
        {benefits.map(([title, body]) => (
          <Card key={title}>
            <CardContent>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <Card>
          <CardContent className="space-y-3 text-sm leading-6 text-muted">
            <h2 className="text-lg font-semibold text-foreground">Security and risk disclosures</h2>
            <p>Cryptocurrency prices can change quickly, and a purchase can fail, expire, or be refunded by the payment partner.</p>
            <p>BuyTheCrypto is not a bank, exchange custodian, or wallet provider. Read the risk disclosure before purchasing.</p>
            <Link href="/risk-disclosure" className="inline-block text-emerald-300">
              Read the risk disclosure
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
