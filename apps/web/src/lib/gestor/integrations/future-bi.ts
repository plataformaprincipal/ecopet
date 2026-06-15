/** Integrações externas de BI/analytics — NOT_CONFIGURED até credenciais válidas. */

export type ExternalBiIntegration = {
  id: string;
  name: string;
  status: "NOT_CONFIGURED" | "ACTIVE" | "ERROR";
  description: string;
  requiredEnvVars: string[];
  docsUrl?: string;
};

export const EXTERNAL_BI_INTEGRATIONS: ExternalBiIntegration[] = [
  {
    id: "metabase",
    name: "Metabase",
    status: "NOT_CONFIGURED",
    description: "Dashboards SQL conectados ao PostgreSQL.",
    requiredEnvVars: ["METABASE_SITE_URL", "METABASE_EMBED_SECRET"],
    docsUrl: "https://www.metabase.com/docs",
  },
  {
    id: "posthog",
    name: "PostHog",
    status: "NOT_CONFIGURED",
    description: "Product analytics e funis.",
    requiredEnvVars: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
    docsUrl: "https://posthog.com/docs",
  },
  {
    id: "sentry",
    name: "Sentry",
    status: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN ? "ACTIVE" : "NOT_CONFIGURED",
    description: "Monitoramento de erros em produção.",
    requiredEnvVars: ["SENTRY_DSN"],
    docsUrl: "https://docs.sentry.io",
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    status: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? "ACTIVE" : "NOT_CONFIGURED",
    description: "Analytics web.",
    requiredEnvVars: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
    docsUrl: "https://developers.google.com/analytics",
  },
  {
    id: "looker_studio",
    name: "Looker Studio",
    status: "NOT_CONFIGURED",
    description: "Relatórios visuais via conector PostgreSQL/BigQuery.",
    requiredEnvVars: ["LOOKER_STUDIO_DATA_SOURCE_ID"],
  },
  {
    id: "admin_webhooks",
    name: "Webhooks administrativos",
    status: process.env.ECOPET_ADMIN_WEBHOOK_URL ? "ACTIVE" : "NOT_CONFIGURED",
    description: "Notificações de eventos administrativos para sistemas externos.",
    requiredEnvVars: ["ECOPET_ADMIN_WEBHOOK_URL"],
  },
  {
    id: "scheduled_reports",
    name: "Exportação agendada",
    status: "NOT_CONFIGURED",
    description: "Jobs cron para envio automático de relatórios por e-mail.",
    requiredEnvVars: ["ECOPET_REPORTS_CRON_SECRET", "ECOPET_REPORTS_EMAIL_TO"],
  },
];

export function listFutureIntegrations() {
  return EXTERNAL_BI_INTEGRATIONS.map((i) => ({
    ...i,
    configured: i.status === "ACTIVE",
  }));
}
