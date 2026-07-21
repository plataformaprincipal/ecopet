import type { ObservabilityProvider } from "./observability.types";
import { isBetterStackConfigured } from "./config";

/**
 * Status real: ACTIVE só quando a integração está configurada E implementada.
 * Sentry está deprecado/stub — nunca ACTIVE.
 */
export function getObservabilityProviders(env = process.env): ObservabilityProvider[] {
  const betterStackReady = isBetterStackConfigured(env);

  return [
    {
      id: "better_stack",
      name: "Better Stack",
      status: betterStackReady ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["BETTER_STACK_SOURCE_TOKEN", "BETTER_STACK_HOST"],
      description: "Logs estruturados / telemetria (substitui Sentry stub)",
    },
    {
      id: "sentry",
      name: "Sentry",
      status: "NOT_CONFIGURED",
      requiredEnvVars: [],
      description: "Deprecado — stub removido; use Better Stack",
    },
    {
      id: "logtail",
      name: "Logtail (legado)",
      status: env.LOGTAIL_SOURCE_TOKEN && !env.BETTER_STACK_SOURCE_TOKEN ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["LOGTAIL_SOURCE_TOKEN"],
      description: "Alias legado do token Better Stack",
    },
    {
      id: "datadog",
      name: "Datadog",
      status: "NOT_CONFIGURED",
      requiredEnvVars: ["DD_API_KEY"],
      description: "Não implementado (env-only placeholder)",
    },
    {
      id: "posthog",
      name: "PostHog",
      status: env.NEXT_PUBLIC_POSTHOG_KEY ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["NEXT_PUBLIC_POSTHOG_KEY"],
      description: "Product analytics (independente)",
    },
    {
      id: "vercel_analytics",
      name: "Vercel Analytics",
      status: env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["NEXT_PUBLIC_VERCEL_ANALYTICS_ID"],
      description: "Analytics web Vercel",
    },
  ];
}
