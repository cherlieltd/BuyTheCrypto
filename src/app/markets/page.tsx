import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Markets</h1>
          <p className="mt-3 text-sm text-muted">
            {markets
              ? `${markets.stale ? "Cached market data" : "Market data"} updated ${formatTimestamp(markets.updatedAt)} from CoinGecko. Not a live trading feed.`
              : "Market data is temporarily unavailable."}
          </p>
        </div>
        <form>
          <label className="sr-only" htmlFor="q">
            Search cryptocurrencies
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search name or symbol"
            className="h-11 rounded-full border border-white/10 bg-black/20 px-4 text-sm"
          />
        </form>
      </div>
      <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h</th>
              <th className="px-4 py-3 font-medium">Market cap</th>
              <th className="px-4 py-3 font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id} className="border-t border-white/10">
                <td className="px-4 py-4">
                  <Link href={`/crypto/${coin.id}`} className="font-medium hover:text-emerald-300">
                    {coin.name} <span className="text-muted">{coin.symbol}</span>
                  </Link>
                </td>
                <td className="px-4 py-4">{formatFiat(coin.price, "USD")}</td>
                <td className={`px-4 py-4 ${coin.change24h != null && coin.change24h < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                  {coin.change24h == null ? "—" : `${coin.change24h.toFixed(2)}%`}
                </td>
                <td className="px-4 py-4">{formatCompact(coin.marketCap)}</td>
                <td className="px-4 py-4">{formatCompact(coin.volume24h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
