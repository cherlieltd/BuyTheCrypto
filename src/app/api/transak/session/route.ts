import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { checkoutSchema } from "@/lib/validation/schemas";
import { getCryptoCurrencies, getFiatCurrencies, verifyWalletAddress } from "@/lib/transak/client";
import { transakOnRamp } from "@/lib/onramp/provider";
import { validateDestinationWallet } from "@/lib/wallets/validate";
import { cryptoOrders } from "@/db/schema";
import { normalizeAsset } from "@/app/api/crypto/assets/route";

export async function POST(request: Request) {
  return handleApi(request, { access: "user", limit: { name: "checkout", limit: 10, windowMs: 60_000 } }, async ({ auth }) => {
    const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the purchase details.");
    }
    const input = parsed.data;

    const [assets, fiats] = await Promise.all([getCryptoCurrencies(), getFiatCurrencies()]);
    const asset = (assets as Parameters<typeof normalizeAsset>[0][]).map(normalizeAsset).find(
      (item) => item.isAllowed && item.symbol === input.cryptoCurrency && item.network === input.network,
    );
    if (!asset) {
      throw new ApiError(400, "UNSUPPORTED_ASSET", "That cryptocurrency and network are not currently available from Transak.");
    }
    const fiat = (fiats as Array<{ symbol?: string; isAllowed?: boolean }>).find(
      (item) => item.symbol?.toUpperCase() === input.fiatCurrency && item.isAllowed,
    );
    if (!fiat) {
      throw new ApiError(400, "UNSUPPORTED_FIAT", "That fiat currency is not currently available from Transak.");
    }

    const wallet = await validateDestinationWallet({
      address: input.walletAddress,
      network: input.network,
      cryptoCurrency: input.cryptoCurrency,
      verifyWithTransak: (address) =>
        verifyWalletAddress({
          cryptoCurrency: input.cryptoCurrency,
          network: input.network,
          walletAddress: address,
        }),
    });
    if (!wallet.ok) throw new ApiError(400, "INVALID_WALLET", wallet.reason);

    const [order] = await auth.db
      .insert(cryptoOrders)
      .values({
        userId: auth.profile.id,
        provider: "transak",
        fiatCurrency: input.fiatCurrency,
        fiatAmount: input.fiatAmount.toFixed(2),
        cryptoCurrency: input.cryptoCurrency,
        blockchainNetwork: input.network,
        walletAddress: input.walletAddress,
        status: "CHECKOUT_OPENED",
      })
      .returning();

    if (!order) throw new ApiError(500, "INTERNAL_ERROR", "The order could not be created.");

    const session = await transakOnRamp.createCheckout(request, {
      fiatCurrency: input.fiatCurrency,
      fiatAmount: input.fiatAmount,
      cryptoCurrencyCode: input.cryptoCurrency,
      network: input.network,
      walletAddress: input.walletAddress,
      partnerOrderId: order.id,
      partnerCustomerId: auth.profile.id,
      email: auth.profile.email,
    });

    return Response.json({
      orderId: order.id,
      status: order.status,
      widgetUrl: session.widgetUrl,
      expiresInSeconds: session.expiresInSeconds,
      notice: "Complete payment and any identity checks inside Transak. BuyTheCrypto does not collect card details.",
    });
  });
}
