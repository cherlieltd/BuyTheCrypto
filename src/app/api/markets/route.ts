import { handleApi } from "@/lib/api";
import { getFeaturedMarkets, getMarketOverview, searchMarkets } from "@/lib/markets/coingecko";
import { ApiError } from "@/lib/errors";

export async function GET(request: Request) {
  return handleApi(request, { access: "public", limit: { name: "markets", limit: 120, windowMs: 60_000 } }, async () => {
    const url = new URL(request.url);
    const currency = (url.searchParams.get("currency") || "usd").toLowerCase();
    const query = url.searchParams.get("q");
    const featured = url.searchParams.get("featured") === "1";
    if (!/^[a-z]{3,5}$/.test(currency)) {
      throw new ApiError(400, "INVALID_CURRENCY", "Currency must be a 3 to 5 letter code.");
    }
    try {
      if (query) {
        const result = await searchMarkets(query);
        return Response.json(result);
      }
      const result = featured ? await getFeaturedMarkets(currency) : await getMarketOverview(currency);
      return Response.json(result);
    } catch (error) {
      throw new ApiError(
        503,
        "MARKET_DATA_UNAVAILABLE",
        error instanceof Error ? error.message : "Market data is temporarily unavailable.",
      );
    }
  });
}
