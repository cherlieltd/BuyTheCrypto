import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { getCoin } from "@/lib/markets/coingecko";
import { getCryptoCurrencies } from "@/lib/transak/client";
import { transakConfig } from "@/lib/transak/config";
import { normalizeAsset } from "@/app/api/crypto/assets/route";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  return handleApi(request, { access: "public", limit: { name: "crypto", limit: 60, windowMs: 60_000 } }, async () => {
    const { slug } = await context.params;
    if (transakConfig().configured) {
      try {
        const assets = ((await getCryptoCurrencies()) as Parameters<typeof normalizeAsset>[0][])
          .map(normalizeAsset)
          .filter((asset) => asset.slug === slug || asset.symbol.toLowerCase() === slug.toLowerCase());
        if (assets.length > 0) {
          return Response.json({ source: "transak", updatedAt: new Date().toISOString(), assets });
        }
      } catch {
        // Fall through to market data when the purchase catalog does not include this slug.
      }
    }

    try {
      const market = await getCoin(slug);
      return Response.json({ source: "coingecko", ...market });
    } catch (error) {
      throw new ApiError(404, "NOT_FOUND", error instanceof Error ? error.message : "Cryptocurrency not found.");
    }
  });
}
