import "server-only";

export async function logError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(JSON.stringify({ level: "error", scope, message, ...extra }));

  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, { tags: { scope }, extra });
  } catch {
    // Sentry is optional until a DSN is configured and the SDK initializes.
  }
}
