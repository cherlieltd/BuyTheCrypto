import { ApiError, errorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/origin";
import { requireAdmin, requireUser } from "@/lib/auth";

type AuthContext = Awaited<ReturnType<typeof requireUser>>;

export async function handleApi<T extends "public" | "user" | "admin">(
  request: Request,
  options: {
    access: T;
    limit: { name: string; limit: number; windowMs: number };
  },
  handler: (context: T extends "public" ? { auth: null } : { auth: AuthContext }) => Promise<Response> | Response,
) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, options.limit);
    if (options.access === "public") {
      return await handler({ auth: null } as T extends "public" ? { auth: null } : { auth: AuthContext });
    }
    const auth = options.access === "admin" ? await requireAdmin() : await requireUser();
    return await handler({ auth } as T extends "public" ? { auth: null } : { auth: AuthContext });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    const { logError } = await import("@/lib/log");
    await logError("api", error);
    return errorResponse(error);
  }
}
