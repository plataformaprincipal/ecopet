/**
 * Configuração Better Stack / observabilidade EcoPet.
 * Token apenas no servidor — nunca NEXT_PUBLIC_*.
 */
export type ObservabilityEnvironment = "development" | "test" | "preview" | "production";

function trim(v: string | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function flag(name: string, defaultOn: boolean): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return defaultOn;
}

export function resolveObservabilityEnvironment(
  env = process.env
): ObservabilityEnvironment {
  const explicit = trim(env.BETTER_STACK_ENVIRONMENT)?.toLowerCase();
  if (
    explicit === "development" ||
    explicit === "test" ||
    explicit === "preview" ||
    explicit === "production"
  ) {
    return explicit;
  }
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  if (env.NODE_ENV === "test") return "test";
  if (env.NODE_ENV === "production") return "production";
  return "development";
}

export function getBetterStackConfig(env = process.env) {
  const hostRaw = trim(env.BETTER_STACK_HOST);
  const host = hostRaw
    ? hostRaw.replace(/\/$/, "").startsWith("http")
      ? hostRaw.replace(/\/$/, "")
      : `https://${hostRaw.replace(/\/$/, "")}`
    : null;

  return {
    sourceToken: trim(env.BETTER_STACK_SOURCE_TOKEN) ?? trim(env.LOGTAIL_SOURCE_TOKEN),
    host,
    sourceId: trim(env.BETTER_STACK_SOURCE_ID),
    region: trim(env.BETTER_STACK_REGION),
    environment: resolveObservabilityEnvironment(env),
    serviceName: trim(env.OTEL_SERVICE_NAME) ?? "ecopet-web",
    release:
      trim(env.VERCEL_GIT_COMMIT_SHA) ??
      trim(env.NEXT_PUBLIC_APP_VERSION) ??
      trim(env.npm_package_version) ??
      "unknown",
    otelEndpoint: trim(env.OTEL_EXPORTER_OTLP_ENDPOINT),
    otelHeaders: trim(env.OTEL_EXPORTER_OTLP_HEADERS),
  };
}

export function isBetterStackConfigured(env = process.env): boolean {
  const c = getBetterStackConfig(env);
  return Boolean(c.sourceToken && c.host);
}

export type ObservabilityFlag =
  | "observability"
  | "betterStackLogs"
  | "clientErrorReporting"
  | "tracing"
  | "metrics"
  | "integrationTelemetry"
  | "securityEvents"
  | "adminObservability"
  | "databaseTracing"
  | "aiTelemetry"
  | "messagingTelemetry"
  | "paymentTelemetry";

const FLAG_ENV: Record<ObservabilityFlag, string> = {
  observability: "OBS_FLAG_ENABLED",
  betterStackLogs: "OBS_FLAG_BETTER_STACK",
  clientErrorReporting: "OBS_FLAG_CLIENT_ERRORS",
  tracing: "OBS_FLAG_TRACING",
  metrics: "OBS_FLAG_METRICS",
  integrationTelemetry: "OBS_FLAG_INTEGRATIONS",
  securityEvents: "OBS_FLAG_SECURITY",
  adminObservability: "OBS_FLAG_ADMIN",
  databaseTracing: "OBS_FLAG_DB_TRACING",
  aiTelemetry: "OBS_FLAG_AI",
  messagingTelemetry: "OBS_FLAG_MESSAGING",
  paymentTelemetry: "OBS_FLAG_PAYMENTS",
};

export function isObservabilityFlagEnabled(name: ObservabilityFlag, env = process.env): boolean {
  const masterOn = flag(FLAG_ENV.observability, true);
  if (name === "observability") return masterOn;
  if (!masterOn) return false;

  if (name === "betterStackLogs") {
    return flag(FLAG_ENV.betterStackLogs, true) && isBetterStackConfigured(env);
  }
  if (name === "tracing") {
    // Traces OTEL: interface pronta; ativo só com endpoint OTEL + flag
    return flag(FLAG_ENV.tracing, false) && Boolean(getBetterStackConfig(env).otelEndpoint);
  }
  if (name === "clientErrorReporting") {
    return flag(FLAG_ENV.clientErrorReporting, true);
  }
  return flag(FLAG_ENV[name], true);
}

export function listObservabilityFlags(env = process.env): Record<ObservabilityFlag, boolean> {
  const out = {} as Record<ObservabilityFlag, boolean>;
  for (const k of Object.keys(FLAG_ENV) as ObservabilityFlag[]) {
    out[k] = isObservabilityFlagEnabled(k, env);
  }
  return out;
}

/** Snapshot sanitizado — nunca inclui token. */
export function getObservabilityHealthSnapshot(env = process.env) {
  const c = getBetterStackConfig(env);
  return {
    configured: isBetterStackConfigured(env),
    environment: c.environment,
    serviceName: c.serviceName,
    release: c.release,
    sourceIdPresent: Boolean(c.sourceId),
    sourceIdPreview: c.sourceId ? `${c.sourceId.slice(0, 6)}…` : null,
    hostPresent: Boolean(c.host),
    hostPreview: c.host
      ? (() => {
          try {
            return new URL(c.host).host;
          } catch {
            return "invalid";
          }
        })()
      : null,
    region: c.region,
    tokenConfigured: Boolean(c.sourceToken),
    otelConfigured: Boolean(c.otelEndpoint),
    tracingFunctional: isObservabilityFlagEnabled("tracing", env),
    flags: listObservabilityFlags(env),
    sentryDeprecated: true,
    sessionReplaySupported: false,
  };
}
