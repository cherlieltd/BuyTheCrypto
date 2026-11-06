import "server-only";

import { normalizeMarketCoin, type MarketQuote } from "@/lib/markets/normalize";

export type { MarketQuote };
export { normalizeMarketCoin };

export type MarketSnapshot = {
  currency: string;
  updatedAt: string;
  stale: boolean;
  coins: MarketQuote[];
};

type CacheEntry<T> = { expiresAt: number; updatedAt: string; value: T };
const cache = new Map<string, CacheEntry<unknown>>();

function coinGeckoBase() {
  return process.env.COINGECKO_API_KEY_TYPE === "pro"
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";
}

function coinGeckoHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const key = process.env.COINGECKO_API_KEY;
  if (!key) return headers;
  if (process.env.COINGECKO_API_KEY_TYPE === "pro") headers["x-cg-pro-api-key"] = key;
  else headers["x-cg-demo-api-key"] = key;
  return headers;
}

async function cachedFetch<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<{ value: T; updatedAt: string; stale: boolean }> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) {
    return { value: hit.value, updatedAt: hit.updatedAt, stale: false };
  }
  try {
    const value = await loader();
    const updatedAt = new Date().toISOString();
    cache.set(key, { value, updatedAt, expiresAt: Date.now() + ttlMs });
    return { value, updatedAt, stale: false };
  } catch (error) {
    if (hit) return { value: hit.value, updatedAt: hit.updatedAt, stale: true };
    throw error;
  }
}

async function coinGecko(path: string) {
  const response = await fetch(`${coinGeckoBase()}${path}`, {
    headers: { accept: "application/json", ...coinGeckoHeaders() },
    cache: "no-store",
  });
  if (response.status === 429) {
    throw new Error("CoinGecko rate limit reached.");
  }
  if (!response.ok) {
    throw new Error(`CoinGecko request failed (${response.status}).`);
  }
  return response.json() as Promise<unknown>;
}

export async function getMarketOverview(currency = "usd"): Promise<MarketSnapshot> {
  const vs = currency.toLowerCase();
  const result = await cachedFetch(`markets:${vs}`, 15_000, async () => {
    const data = (await coinGecko(
      `/coins/markets?vs_currency=${encodeURIComponent(vs)}&order=market_cap_desc&per_page=24&page=1&sparkline=true&price_change_percentage=24h`,
    )) as Array<Parameters<typeof normalizeMarketCoin>[0] & { sparkline_in_7d?: { price: number[] } }>;
    return data.map((coin) => ({
      ...normalizeMarketCoin(coin),
      sparkline: coin.sparkline_in_7d?.price ?? [],
    }));
  });
  return { currency: vs, updatedAt: result.updatedAt, stale: result.stale, coins: result.value };
}

export async function getFeaturedMarkets(currency = "usd") {
  const vs = currency.toLowerCase();
  const result = await cachedFetch(`featured:${vs}`, 15_000, async () => {
    const data = (await coinGecko(
      `/coins/markets?vs_currency=${encodeURIComponent(vs)}&ids=bitcoin,ethereum,tether,solana&order=market_cap_desc&sparkline=true&price_change_percentage=24h`,
    )) as Array<Parameters<typeof normalizeMarketCoin>[0] & { sparkline_in_7d?: { price: number[] } }>;
    return data.map((coin) => ({
      ...normalizeMarketCoin(coin),
      sparkline: coin.sparkline_in_7d?.price ?? [],
    }));
  });
  return { currency: vs, updatedAt: result.updatedAt, stale: result.stale, coins: result.value };
}

export async function searchMarkets(query: string) {
  const result = await cachedFetch(`search:${query.toLowerCase()}`, 60_000, async () => {
    const data = (await coinGecko(`/search?query=${encodeURIComponent(query)}`)) as {
      coins?: Array<{ id: string; name: string; symbol: string; thumb?: string; market_cap_rank?: number }>;
    };
    return (data.coins ?? []).slice(0, 12);
  });
  return { updatedAt: result.updatedAt, stale: result.stale, coins: result.value };
}

export async function getCoinChart(id: string, currency = "usd", days = "7") {
  const safeDays = ["1", "7", "30", "90", "365"].includes(days) ? days : "7";
  const result = await cachedFetch(`chart:${id}:${currency}:${safeDays}`, 120_000, async () => {
    const data = (await coinGecko(
      `/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${encodeURIComponent(currency)}&days=${safeDays}`,
    )) as { prices?: [number, number][] };
    return data.prices ?? [];
  });
  return { id, currency, days: safeDays, updatedAt: result.updatedAt, stale: result.stale, prices: result.value };
}

export async function getCoin(id: string) {
  const result = await cachedFetch(`coin:${id}`, 60_000, async () => {
    return (await coinGecko(
      `/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    )) as {
      id: string;
      symbol: string;
      name: string;
      image?: { large?: string };
      description?: { en?: string };
      market_data?: {
        current_price?: Record<string, number>;
        market_cap?: Record<string, number>;
        total_volume?: Record<string, number>;
        price_change_percentage_24h?: number;
        last_updated?: string;
      };
    };
  });
  return { updatedAt: result.updatedAt, stale: result.stale, coin: result.value };
}
