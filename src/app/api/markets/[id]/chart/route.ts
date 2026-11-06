import { handleApi } from "@/lib/api";
import { getCoinChart } from "@/lib/markets/coingecko";
import { ApiError } from "@/lib/errors";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(request, { access: "public", limit: { name: "charts", limit: 60, windowMs: 60_000 } }, async () => {
    const { id } = await context.params;
    if (!/^[a-z0-9-]{1,80}$/.test(id)) {
      throw new ApiError(400, "INVALID_ASSET", "Unknown cryptocurrency id.");
    }
    const days = new URL(request.url).searchParams.get("days") ?? "7";
    const currency = new URL(request.url).searchParams.get("currency") ?? "usd";
    try {
      return Response.json(await getCoinChart(id, currency, days));
    } catch (error) {
      throw new ApiError(
        503,
        "MARKET_DATA_UNAVAILABLE",
        error instanceof Error ? error.message : "Chart data is temporarily unavailable.",
      );
    }
  });
}
