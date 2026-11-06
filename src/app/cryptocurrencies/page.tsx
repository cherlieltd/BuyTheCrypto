import type { Metadata } from "next";
import Link from "next/link";
import { getMarketOverview } from "@/lib/markets/coingecko";
import { Card, CardContent } from "@/components/ui/card";
import { formatFiat, formatTimestamp } from "@/lib/utils";

export const metadata: Metadata = { title: "Cryptocurrencies" };

export default async function CryptocurrenciesPage() {
  const markets = await getMarketOverview("usd").catch(() => null);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Cryptocurrencies</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {markets
          ? `Prices below were retrieved ${formatTimestamp(markets.updatedAt)}${markets.stale ? " and are cached" : ""}. Purchase availability is confirmed separately by Transak on the buy page.`
          : "Market data is temporarily unavailable."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(markets?.coins ?? []).map((coin) => (
          <Card key={coin.id}>
            <CardContent>
              <h2 className="text-lg font-semibold">{coin.name}</h2>
              <p className="text-sm text-muted">{coin.symbol}</p>
              <p className="mt-4 text-2xl">{formatFiat(coin.price, "USD")}</p>
              <div className="mt-4 flex gap-3 text-sm">
                <Link className="text-emerald-300" href={`/crypto/${coin.id}`}>
                  Details
                </Link>
                <Link className="text-muted" href={`/buy-crypto?crypto=${coin.symbol}`}>
                  Buy
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
