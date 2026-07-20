import "server-only";

/**
 * Abstração de webhooks analytics (futuro).
 * Não acopla a provedor externo — ecoa contrato reutilizável.
 */
export type AnalyticsWebhookEnvelope = {
  id: string;
  type: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export function createAnalyticsWebhookStub() {
  return {
    enabled: false,
    note: "Webhooks inbound GA não são necessários — EcoPet usa Data API pull + client gtag.",
    accept(_envelope: AnalyticsWebhookEnvelope) {
      return { accepted: false, reason: "not_implemented" as const };
    },
  };
}
