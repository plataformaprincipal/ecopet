import { logStructured } from "./logger";
import { redactForObservability, sanitizeErrorMessage, hashIdentifier } from "./redaction";
import { getRequestContext } from "./context";
import { isObservabilityFlagEnabled } from "./config";

export type ErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "external_integration"
  | "database"
  | "timeout"
  | "network"
  | "business_rule"
  | "security"
  | "internal"
  | "unknown";

export function classifyError(error: unknown): ErrorCategory {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : "";

  if (code.includes("p2002") || msg.includes("unique")) return "conflict";
  if (code.includes("p2025") || msg.includes("not found")) return "not_found";
  if (msg.includes("unauthorized") || msg.includes("unauthenticated")) return "authentication";
  if (msg.includes("forbidden") || msg.includes("denied")) return "authorization";
  if (msg.includes("rate limit") || msg.includes("too many")) return "rate_limit";
  // Prisma/database antes de timeout genérico (ex.: "prisma timeout")
  if (msg.includes("prisma") || msg.includes("database") || msg.includes("postgres") || code.startsWith("p"))
    return "database";
  if (msg.includes("timeout") || msg.includes("etimedout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("validation") || msg.includes("invalid")) return "validation";
  if (msg.includes("openai") || msg.includes("talkjs") || msg.includes("mercado") || msg.includes("resend"))
    return "external_integration";
  if (msg.includes("csrf") || msg.includes("idor") || msg.includes("injection")) return "security";
  return "unknown";
}

export function errorFingerprint(error: unknown, route?: string): string {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120);
  return `${route ?? "unknown"}:${name}:${message}`.replace(/\s+/g, "_").slice(0, 180);
}

/**
 * Captura de erro server-side — substitui stub Sentry.
 */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {}
): { correlationId?: string; fingerprint: string; category: ErrorCategory } {
  const req = getRequestContext();
  const category = classifyError(error);
  const fingerprint = errorFingerprint(error, typeof context.route === "string" ? context.route : req?.route);
  const correlationId = (context.correlationId as string | undefined) ?? req?.correlationId;

  const safeCtx = redactForObservability({
    ...context,
    category,
    fingerprint,
    correlationId,
    error: error instanceof Error ? { name: error.name, message: sanitizeErrorMessage(error.message) } : String(error),
  }) as Record<string, unknown>;

  logStructured("error", sanitizeErrorMessage(error instanceof Error ? error.message : "Unknown error"), {
    event: "error.captured",
    module: typeof context.module === "string" ? context.module : "app",
    errorType: category,
    errorCode: fingerprint,
    ...safeCtx,
  });

  return { correlationId, fingerprint, category };
}

export function captureSecurityEvent(
  event: string,
  fields: Record<string, unknown> = {}
) {
  if (!isObservabilityFlagEnabled("securityEvents")) return;
  logStructured("warn", event, {
    event: `security.${event}`,
    module: "security",
    ...redactForObservability(fields) as Record<string, unknown>,
    userIdHash:
      typeof fields.userId === "string" ? hashIdentifier(fields.userId) : undefined,
  });
}
