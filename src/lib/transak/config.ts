import "server-only";

export type TransakEnvironment = "staging" | "production";

export function transakEnvironment(): TransakEnvironment {
  return process.env.TRANSAK_ENV === "production" ? "production" : "staging";
}

export function transakConfig() {
  const environment = transakEnvironment();
  const apiKey = process.env.TRANSAK_API_KEY ?? "";
  const apiSecret = process.env.TRANSAK_API_SECRET ?? "";
  const referrerDomain = process.env.TRANSAK_REFERRER_DOMAIN || "buythecrypto.com";
  const configured = Boolean(apiKey && apiSecret);

  return {
    environment,
    configured,
    apiKey,
    apiSecret,
    referrerDomain,
    apiBaseUrl:
      environment === "production" ? "https://api.transak.com" : "https://api-stg.transak.com",
    gatewayBaseUrl:
      environment === "production"
        ? "https://api-gateway.transak.com"
        : "https://api-gateway-stg.transak.com",
  };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "127.0.0.1";
}
