import type { ObservabilityProvider } from "./observability.types";

export function getObservabilityProviders(env = process.env): ObservabilityProvider[] {
  return [
    {
      id: "sentry",
      name: "Sentry",
      status: env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["SENTRY_DSN"],
      description: "Monitoramento de erros",
    },
    {
      id: "logtail",
      name: "Logtail",
      status: env.LOGTAIL_SOURCE_TOKEN ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["LOGTAIL_SOURCE_TOKEN"],
      description: "Logs centralizados",
    },
    {
      id: "datadog",
      name: "Datadog",
      status: env.DD_API_KEY ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["DD_API_KEY"],
      description: "APM e métricas",
    },
    {
      id: "posthog",
      name: "PostHog",
      status: env.NEXT_PUBLIC_POSTHOG_KEY ? "ACTIVE" : "NOT_CONFIGURED",
      requiredEnvVars: ["NEXT_PUBLIC_POSTHOG_KEY"],
      description: "Product analytics",
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
