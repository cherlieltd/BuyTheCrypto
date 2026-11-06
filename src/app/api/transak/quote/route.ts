import { handleApi } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation/schemas";
import { getBuyQuote } from "@/lib/transak/client";
import { ApiError } from "@/lib/errors";

export async function GET(request: Request) {
  return handleApi(request, { access: "user", limit: { name: "quote", limit: 30, windowMs: 60_000 } }, async () => {
    const url = new URL(request.url);
    const parsed = checkoutSchema.safeParse({
      fiatCurrency: url.searchParams.get("fiatCurrency"),
      cryptoCurrency: url.searchParams.get("cryptoCurrency"),
      network: url.searchParams.get("network"),
      fiatAmount: Number(url.searchParams.get("fiatAmount")),
      walletAddress: "0x0000000000000000000000000000000000000000",
    });
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid quote request.");
    }
    try {
      const quote = await getBuyQuote({
        fiatCurrency: parsed.data.fiatCurrency,
        cryptoCurrency: parsed.data.cryptoCurrency,
        network: parsed.data.network,
        fiatAmount: parsed.data.fiatAmount,
      });
      return Response.json({
        updatedAt: new Date().toISOString(),
        quote: {
          quoteId: quote.quoteId ?? null,
          fiatCurrency: quote.fiatCurrency,
          fiatAmount: quote.fiatAmount,
          cryptoCurrency: quote.cryptoCurrency,
          cryptoAmount: quote.cryptoAmount,
          network: quote.network,
          totalFee: quote.totalFee ?? null,
          paymentMethod: quote.paymentMethod ?? null,
        },
        notice: "This is a Transak estimate. The checkout screen confirms the final amount before you pay.",
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(503, "TRANSAK_ERROR", "A quote could not be retrieved from Transak.");
    }
  });
}
