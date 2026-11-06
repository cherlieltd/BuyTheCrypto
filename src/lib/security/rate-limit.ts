import { ApiError } from "@/lib/errors";

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export type LimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
};

export function consumeMemoryLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): LimitResult {
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return { success: false, remaining: 0, limit };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { success: true, remaining: limit - bucket.timestamps.length, limit };
}

export function resetMemoryLimits() {
  buckets.clear();
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export async function enforceRateLimit(
  request: Request,
  options: { name: string; limit: number; windowMs: number },
) {
  const key = `${options.name}:${clientKey(request)}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms`),
      prefix: `btc:${options.name}`,
    });
    const result = await limiter.limit(key);
    if (!result.success) {
      throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait and try again.");
    }
    return;
  }

  const result = consumeMemoryLimit(key, options.limit, options.windowMs);
  if (!result.success) {
    throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait and try again.");
  }
}
