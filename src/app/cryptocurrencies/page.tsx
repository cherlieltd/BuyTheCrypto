import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMarketOverview } from "@/lib/markets/coingecko";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFiat, formatTimestamp } from "@/lib/utils";

export const metadata: Metadata = { title: "Cryptocurrencies" };

export default async function CryptocurrenciesPage() {
  const markets = await getMarketOverview("usd").catch(() => null);
  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Cryptocurrencies</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        {markets
          ? `Prices below were retrieved ${formatTimestamp(markets.updatedAt)}${markets.stale ? " and are cached" : ""}. Purchase availability is confirmed separately by Transak on the buy page.`
          : "Market data is temporarily unavailable."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(markets?.coins ?? []).map((coin) => (
          <Card key={coin.id} className="transition hover:-translate-y-0.5 hover:border-accent/30">
            <CardContent>
              <div className="flex items-center gap-3">
                {coin.image ? <Image src={coin.image} alt="" width={40} height={40} className="rounded-full" /> : null}
                <div>
                  <h2 className="font-display text-lg font-semibold">{coin.name}</h2>
                  <p className="text-sm text-muted">{coin.symbol}</p>
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold">{formatFiat(coin.price, "USD")}</p>
              <Badge className="mt-3" tone={coin.change24h != null && coin.change24h < 0 ? "danger" : "success"}>
                {coin.change24h == null ? "24h unavailable" : `${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
              </Badge>
              <div className="mt-5 flex gap-3">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/crypto/${coin.id}`}>Details</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/buy-crypto?crypto=${coin.symbol}`}>Buy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
