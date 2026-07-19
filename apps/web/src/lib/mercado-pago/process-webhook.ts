import "server-only";

/**
 * Compat: delega ao pipeline multi-tópico.
 * @deprecated Prefer `runMercadoPagoWebhookPipeline`.
 */
export { runMercadoPagoWebhookPipeline as processMercadoPagoWebhook } from "@/lib/mercado-pago/webhooks/pipeline";
export type { PipelineResult as ProcessMpWebhookResult } from "@/lib/mercado-pago/webhooks/pipeline";
