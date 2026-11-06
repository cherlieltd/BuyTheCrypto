import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, getCoinChart } from "@/lib/markets/coingecko";
import { PriceChart } from "@/components/markets/charts";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm text-muted">{detail.coin.symbol?.toUpperCase()}</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">{detail.coin.name}</h1>
          <p className="mt-3 text-3xl">{formatFiat(price, "USD")}</p>
          <p className="mt-2 text-sm text-muted">
            {detail.stale ? "Cached market data" : "Market data"} updated {formatTimestamp(updatedAt)}.
          </p>
        </div>
        <Button asChild>
          <Link href={`/buy-crypto?crypto=${detail.coin.symbol?.toUpperCase() ?? ""}`}>Buy {detail.coin.symbol?.toUpperCase()}</Link>
        </Button>
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-card p-4">
        <div className="mb-4 flex gap-2 text-sm">
          {["1", "7", "30", "90"].map((value) => (
            <Link key={value} href={`/crypto/${slug}?days=${value}`} className={value === days ? "text-emerald-300" : "text-muted"}>
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
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 p-4">
          <dt className="text-xs text-muted">Market cap</dt>
          <dd className="mt-2">{formatCompact(detail.coin.market_data?.market_cap?.usd ?? 0)}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <dt className="text-xs text-muted">24h volume</dt>
          <dd className="mt-2">{formatCompact(detail.coin.market_data?.total_volume?.usd ?? 0)}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <dt className="text-xs text-muted">24h change</dt>
          <dd className="mt-2">{detail.coin.market_data?.price_change_percentage_24h?.toFixed(2) ?? "—"}%</dd>
        </div>
      </dl>
    </main>
  );
}
