import { handleApi } from "@/lib/api";
import { getFiatCurrencies } from "@/lib/transak/client";
import { transakConfig } from "@/lib/transak/config";
import { ApiError } from "@/lib/errors";

export async function GET(request: Request) {
  return handleApi(request, { access: "public", limit: { name: "fiat", limit: 60, windowMs: 60_000 } }, async () => {
    if (!transakConfig().configured) {
      return Response.json({
        configured: false,
        currencies: [],
        message: "Transak credentials are not configured, so supported fiat currencies cannot be listed yet.",
      });
    }
    try {
      const response = (await getFiatCurrencies()) as Array<{
        symbol?: string;
        name?: string;
        isAllowed?: boolean;
        isPopular?: boolean;
        paymentOptions?: Array<{ id?: string; name?: string; isActive?: boolean; minAmount?: number; maxAmount?: number }>;
      }>;
      const currencies = response
        .filter((item) => item.isAllowed && item.symbol)
        .map((item) => ({
          symbol: item.symbol,
          name: item.name,
          isPopular: item.isPopular === true,
          paymentOptions: (item.paymentOptions ?? [])
            .filter((option) => option.isActive !== false && option.id && option.name)
            .map((option) => ({
              id: option.id,
              name: option.name,
              minAmount: option.minAmount ?? null,
              maxAmount: option.maxAmount ?? null,
            })),
        }));
      return Response.json({ configured: true, updatedAt: new Date().toISOString(), currencies });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(503, "TRANSAK_ERROR", "Supported fiat currencies could not be loaded from Transak.");
    }
  });
}
