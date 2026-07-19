import {
  resolvePanelTopic,
  type MpPanelTopicKey,
  type MpTopicCapability,
  type MpTopicDefinition,
} from "@/lib/mercado-pago/webhooks/event-types";
import {
  parseMercadoPagoWebhookBody,
  sanitizeWebhookPayload,
  type ParsedMpWebhook,
} from "@/lib/mercado-pago/webhooks/parse-event";

export type NormalizedMpWebhook = {
  parsed: ParsedMpWebhook;
  topic: MpTopicDefinition;
  panelKey: MpPanelTopicKey;
  capability: MpTopicCapability;
  resourceType: string;
  sanitizedPayload: Record<string, unknown>;
};

export function normalizeMercadoPagoWebhook(rawBody: string): NormalizedMpWebhook | null {
  const parsed = parseMercadoPagoWebhookBody(rawBody);
  if (!parsed) return null;

  const topic = resolvePanelTopic(parsed.rawType);
  // Card updater: type automatic-payments + action card.updated
  let resolved = topic;
  if (
    parsed.rawType.toLowerCase() === "automatic-payments" ||
    parsed.action === "card.updated"
  ) {
    resolved = resolvePanelTopic("automatic-payments");
  }

  return {
    parsed,
    topic: resolved,
    panelKey: resolved.panelKey,
    capability: resolved.capability,
    resourceType: resolved.panelKey,
    sanitizedPayload: sanitizeWebhookPayload(parsed),
  };
}
