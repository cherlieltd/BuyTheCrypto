import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, getCoinChart } from "@/lib/markets/coingecko";
import { PriceChart } from "@/components/markets/charts";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function CryptoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { slug } = await params;
  const { days = "7" } = await searchParams;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();

  const [detail, chart] = await Promise.all([
    getCoin(slug).catch(() => null),
    getCoinChart(slug, "usd", days).catch(() => null),
  ]);
  if (!detail) notFound();

  const price = detail.coin.market_data?.current_price?.usd ?? 0;
  const updatedAt = detail.coin.market_data?.last_updated ?? detail.updatedAt;
  const change = detail.coin.market_data?.price_change_percentage_24h;

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          {detail.coin.image?.large ? (
            <Image src={detail.coin.image.large} alt="" width={56} height={56} className="rounded-full" />
          ) : null}
          <div>
            <p className="text-sm uppercase text-muted">{detail.coin.symbol?.toUpperCase()}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{detail.coin.name}</h1>
            <p className="mt-3 text-3xl font-semibold">{formatFiat(price, "USD")}</p>
            <p className={`mt-2 text-sm font-medium ${change != null && change < 0 ? "text-danger" : "text-success"}`}>
              {change == null ? "24h change unavailable" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}% 24h`}
            </p>
            <p className="mt-2 text-sm text-muted">
              {detail.stale ? "Cached market data" : "Market data"} updated {formatTimestamp(updatedAt)}.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={`/buy-crypto?crypto=${detail.coin.symbol?.toUpperCase() ?? ""}`}>Buy {detail.coin.symbol?.toUpperCase()}</Link>
        </Button>
      </div>
      <Card className="mt-8">
        <CardContent>
          <div className="mb-4 flex gap-2 text-sm">
            {["1", "7", "30", "90"].map((value) => (
              <Link
                key={value}
                href={`/crypto/${slug}?days=${value}`}
                className={value === days ? "rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-foreground" : "rounded-lg px-3 py-1.5 text-muted hover:bg-surface"}
              >
                {value}d
              </Link>
            ))}
          </div>
          <PriceChart prices={chart?.prices ?? []} />
          {chart ? (
            <p className="mt-3 text-xs text-muted">
              Chart {chart.stale ? "cached" : "retrieved"} {formatTimestamp(chart.updatedAt)}.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wide text-muted">Market cap</dt>
          <dd className="mt-2 text-lg font-semibold">{formatCompact(detail.coin.market_data?.market_cap?.usd ?? 0)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wide text-muted">24h volume</dt>
          <dd className="mt-2 text-lg font-semibold">{formatCompact(detail.coin.market_data?.total_volume?.usd ?? 0)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <dt className="text-xs uppercase tracking-wide text-muted">24h change</dt>
          <dd className="mt-2 text-lg font-semibold">{change?.toFixed(2) ?? "—"}%</dd>
        </div>
      </dl>
    </main>
  );
}
