"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/home/reveal";
import { Sparkline } from "@/components/markets/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompact, formatFiat, formatTimestamp } from "@/lib/utils";

export type LiveCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number | null;
  sparkline?: number[];
};

export type LiveMarketSnapshot = {
  currency: string;
  updatedAt: string;
  stale: boolean;
  coins: LiveCoin[];
};

const REFRESH_MS = 20_000;

async function fetchMarkets(featured: boolean): Promise<LiveMarketSnapshot> {
  const response = await fetch(`/api/markets?currency=usd${featured ? "&featured=1" : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Market data could not be refreshed.");
  return response.json() as Promise<LiveMarketSnapshot>;
}

function PriceValue({ price, className }: { price: number; className?: string }) {
  const previous = useRef(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (previous.current === price) return;
    setFlash(price > previous.current ? "up" : "down");
    previous.current = price;
    const timer = window.setTimeout(() => setFlash(null), 900);
    return () => window.clearTimeout(timer);
  }, [price]);

  return (
    <span
      className={`${className ?? ""} transition-colors duration-300 ${
        flash === "up" ? "text-success" : flash === "down" ? "text-danger" : ""
      }`}
    >
      {formatFiat(price, "USD")}
    </span>
  );
}

function StatusLine({
  snapshot,
  isFetching,
  empty,
  freshLabel,
}: {
  snapshot?: LiveMarketSnapshot | null;
  isFetching: boolean;
  empty: string;
  freshLabel: string;
}) {
  if (!snapshot) return <p className="mt-2 text-sm text-muted">{empty}</p>;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
      <span
        className={`inline-flex h-2 w-2 rounded-full ${
          snapshot.stale ? "bg-warning" : isFetching ? "animate-pulse bg-accent" : "bg-success"
        }`}
        aria-hidden
      />
      <span>
        {snapshot.stale
          ? `Cached market data updated ${formatTimestamp(snapshot.updatedAt)} via CoinGecko. Quoted in USD.`
          : `${isFetching ? "Updating prices…" : freshLabel} ${formatTimestamp(snapshot.updatedAt)} via CoinGecko. Quoted in USD.`}
      </span>
    </p>
  );
}

export function LiveHomeMarkets({
  initialFeatured,
  initialMarkets,
}: {
  initialFeatured: LiveMarketSnapshot | null;
  initialMarkets: LiveMarketSnapshot | null;
}) {
  const featured = useQuery({
    queryKey: ["home-featured-markets"],
    queryFn: () => fetchMarkets(true),
    initialData: initialFeatured ?? undefined,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  const markets = useQuery({
    queryKey: ["home-market-overview"],
    queryFn: () => fetchMarkets(false),
    initialData: initialMarkets ?? undefined,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });

  const featuredData = featured.data ?? initialFeatured;
  const marketsData = markets.data ?? initialMarkets;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="markets-heading">
        <Reveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 id="markets-heading" className="font-display text-3xl font-semibold tracking-tight">
                Market overview
              </h2>
              <StatusLine
                snapshot={featuredData}
                isFetching={featured.isFetching}
                empty="Market data is temporarily unavailable."
                freshLabel="Live prices updated"
              />
            </div>
            <Link href="/markets" className="hidden text-sm font-semibold text-accent sm:inline">
              View markets
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(featuredData?.coins ?? []).map((coin, index) => (
            <Reveal key={coin.id} delay={index * 0.05}>
              <Link href={`/crypto/${coin.id}`}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-accent/30">
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {coin.image ? (
                          <Image src={coin.image} alt="" width={36} height={36} className="rounded-full" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-xs font-semibold">
                            {coin.symbol.slice(0, 3)}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{coin.name}</p>
                          <p className="text-xs uppercase text-muted">{coin.symbol}</p>
                        </div>
                      </div>
                      <Sparkline prices={coin.sparkline ?? []} width={72} height={32} />
                    </div>
                    <p className="mt-5 text-2xl font-semibold tracking-tight">
                      <PriceValue price={coin.price} />
                    </p>
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
                <StatusLine
                  snapshot={marketsData}
                  isFetching={markets.isFetching}
                  empty="Market table unavailable right now."
                  freshLabel="Live ranking updated"
                />
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
                {(marketsData?.coins ?? []).slice(0, 10).map((coin, index) => (
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
                    <td className="px-4 py-4 font-medium">
                      <PriceValue price={coin.price} />
                    </td>
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
    </>
  );
}
