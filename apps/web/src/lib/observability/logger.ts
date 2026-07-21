import {
  getBetterStackConfig,
  isObservabilityFlagEnabled,
  resolveObservabilityEnvironment,
  type ObservabilityEnvironment,
} from "./config";
import { getRequestContext } from "./context";
import { redactForObservability, sanitizeErrorMessage } from "./redaction";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export type StructuredLogFields = {
  module?: string;
  action?: string;
  event?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  errorType?: string;
  errorCode?: string;
  integration?: string;
  [key: string]: unknown;
};

function shouldLog(level: LogLevel, environment: ObservabilityEnvironment): boolean {
  if (level === "trace" || level === "debug") {
    return environment === "development" || environment === "test";
  }
  return true;
}

function consoleWrite(level: LogLevel, entry: Record<string, unknown>) {
  const line = JSON.stringify(entry);
  if (level === "error" || level === "fatal") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Logger estruturado EcoPet.
 * Console sempre (sanitizado); Better Stack quando configurado (server).
 */
export function logStructured(
  level: LogLevel,
  message: string,
  fields: StructuredLogFields = {}
) {
  if (!isObservabilityFlagEnabled("observability")) {
    if (level === "error" || level === "fatal") {
      console.error(sanitizeErrorMessage(message));
    }
    return;
  }

  const cfg = getBetterStackConfig();
  const env = resolveObservabilityEnvironment();
  if (!shouldLog(level, env)) return;

  const req = getRequestContext();
  const entry = redactForObservability({
    timestamp: new Date().toISOString(),
    level,
    message: sanitizeErrorMessage(message),
    environment: env,
    service: cfg.serviceName,
    release: cfg.release,
    runtime: typeof process !== "undefined" ? `node-${process.version}` : "unknown",
    region: cfg.region ?? process.env.VERCEL_REGION ?? undefined,
    correlationId: fields.correlationId ?? req?.correlationId,
    requestId: fields.requestId ?? req?.requestId,
    route: fields.route ?? req?.route,
    method: fields.method ?? req?.method,
    module: fields.module ?? req?.module,
    userIdHash: req?.userIdHash,
    role: fields.role ?? req?.role,
    ...fields,
  }) as Record<string, unknown>;

  consoleWrite(level === "fatal" ? "error" : level === "trace" ? "debug" : level, entry);

  if (typeof window === "undefined" && isObservabilityFlagEnabled("betterStackLogs")) {
    const transportLevel =
      level === "fatal" || level === "error"
        ? "error"
        : level === "warn"
          ? "warn"
          : level === "debug" || level === "trace"
            ? "debug"
            : "info";

    // webpackIgnore: @logtail/node é Node-only — não empacotar em Edge/client.
    void import(/* webpackIgnore: true */ "./better-stack-transport")
      .then(({ sendToBetterStack }) =>
        sendToBetterStack(transportLevel, String(entry.message ?? message), entry)
      )
      .catch(() => undefined);
  }
}

/** Alias legado mantido. */
export function log(level: "debug" | "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  logStructured(level, message, meta ?? {});
}
