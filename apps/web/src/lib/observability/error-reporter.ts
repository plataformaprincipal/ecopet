export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN) {
    // integração futura com @sentry/nextjs
  }
  console.error("[error-reporter]", error, context ? JSON.stringify(context) : "");
}
