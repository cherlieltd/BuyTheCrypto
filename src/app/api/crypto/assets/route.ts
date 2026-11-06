import { handleApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { getCryptoCurrencies, getFiatCurrencies } from "@/lib/transak/client";
import { listVisibleAssets } from "@/lib/orders/store";
import { transakConfig } from "@/lib/transak/config";

type RawAsset = {
  symbol?: string;
  name?: string;
  uniqueId?: string;
  isAllowed?: boolean;
  image?: { large?: string; small?: string };
  network?: { name?: string };
};

export function normalizeAsset(item: RawAsset) {
  const symbol = (item.symbol ?? "").toUpperCase();
  const network = item.network?.name ?? "";
  return {
    symbol,
    name: item.name ?? symbol,
    slug: `${symbol}-${network}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    network,
    imageUrl: item.image?.large || item.image?.small || "",
    uniqueId: item.uniqueId ?? "",
    isAllowed: item.isAllowed === true,
  };
}

export async function GET(request: Request) {
  return handleApi(request, { access: "public", limit: { name: "assets", limit: 60, windowMs: 60_000 } }, async () => {
    if (!transakConfig().configured) {
      return Response.json({
        configured: false,
        updatedAt: null,
        assets: [],
        message: "Transak credentials are not configured, so supported purchase assets cannot be listed yet.",
      });
    }
    try {
      const raw = (await getCryptoCurrencies()) as RawAsset[];
      const visibility = await listVisibleAssets();
      const assets = raw
        .map(normalizeAsset)
        .filter((asset) => asset.isAllowed && asset.symbol && asset.network)
        .filter((asset) => visibility.get(asset.slug) !== false);
      return Response.json({ configured: true, updatedAt: new Date().toISOString(), assets });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(503, "TRANSAK_ERROR", "Supported assets could not be loaded from Transak.");
    }
  });
}

export async function getPaymentMethods() {
  if (!transakConfig().configured) {
    return { configured: false, methods: [] as Array<{ id: string; name: string; processingTime?: string }> };
  }
  const raw = (await getFiatCurrencies()) as Array<{
    isAllowed?: boolean;
    paymentOptions?: Array<{ id?: string; name?: string; isActive?: boolean; processingTime?: string }>;
  }>;
  const methods = new Map<string, { id: string; name: string; processingTime?: string }>();
  for (const fiat of raw) {
    if (fiat.isAllowed === false) continue;
    for (const option of fiat.paymentOptions ?? []) {
      if (!option.id || !option.name || option.isActive === false) continue;
      if (!methods.has(option.id)) {
        methods.set(option.id, { id: option.id, name: option.name, processingTime: option.processingTime });
      }
    }
  }
  return { configured: true, methods: [...methods.values()] };
}
