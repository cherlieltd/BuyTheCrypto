export type MarketQuote = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number | null;
  updatedAt: string;
};

export function normalizeMarketCoin(coin: {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  price_change_percentage_24h?: number | null;
  last_updated?: string;
}): MarketQuote {
  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image ?? "",
    price: coin.current_price ?? 0,
    marketCap: coin.market_cap ?? 0,
    volume24h: coin.total_volume ?? 0,
    change24h: coin.price_change_percentage_24h ?? null,
    updatedAt: coin.last_updated ?? new Date().toISOString(),
  };
}
