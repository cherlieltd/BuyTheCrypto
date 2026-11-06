import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Sparkline } from "@/components/markets/charts";
import { getMarketOverview } from "@/lib/markets/coingecko";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";

export const metadata: Metadata = { title: "Markets" };

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const markets = await getMarketOverview("usd").catch(() => null);
  const query = params.q?.toLowerCase() ?? "";
  const coins = (markets?.coins ?? []).filter((coin) =>
    query ? `${coin.name} ${coin.symbol}`.toLowerCase().includes(query) : true,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Markets</h1>
          <p className="mt-3 text-sm text-muted">
            {markets
              ? `${markets.stale ? "Cached market data" : "Market data"} updated ${formatTimestamp(markets.updatedAt)} from CoinGecko. Not a live trading feed.`
              : "Market data is temporarily unavailable."}
          </p>
        </div>
        <form className="w-full sm:w-72">
          <label className="sr-only" htmlFor="q">
            Search cryptocurrencies
          </label>
          <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Search name or symbol" />
        </form>
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h</th>
              <th className="px-4 py-3 font-medium">Market cap</th>
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium">7d</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => (
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
                <td className="px-4 py-4">{formatCompact(coin.volume24h)}</td>
                <td className="px-4 py-4">
                  <Sparkline prices={coin.sparkline ?? []} width={88} height={28} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
