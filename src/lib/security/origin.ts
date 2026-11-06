import { ApiError } from "@/lib/errors";

const ORIGIN_EXEMPT_PREFIXES = ["/api/transak/webhook", "/api/inngest"];

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const pathname = new URL(request.url).pathname;
  if (ORIGIN_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return;
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  const host = request.headers.get("host");
  if (!host) {
    throw new ApiError(403, "FORBIDDEN", "Request host is missing.");
  }

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "FORBIDDEN", "Invalid request origin.");
  }

  if (originHost !== host) {
    throw new ApiError(403, "FORBIDDEN", "Cross-origin request blocked.");
  }
}
