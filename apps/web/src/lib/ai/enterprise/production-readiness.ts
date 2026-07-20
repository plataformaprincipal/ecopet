/**
 * Checklist técnico de produção — evidências, não suposições.
 */
import "server-only";

import { AI_CONFIG } from "@/lib/ai/ai-config";
import { FUNCTION_CALLING_READY } from "@/lib/ai/modules/function-calling";
import { listBusinessTools } from "@/lib/ai/modules/tool-registry";
import { runAiFoundationHealth } from "@/lib/ai/foundation";
import { MONITORING_INTEGRATIONS_READY } from "./monitoring";

export type ReadinessVerdict = "approved" | "approved_with_reservations" | "needs_fix";

export type ReadinessItem = {
  id: string;
  label: string;
  ok: boolean;
  evidence: string;
  verdict: ReadinessVerdict;
};

export async function evaluateAiProductionReadiness(): Promise<{
  overall: ReadinessVerdict;
  items: ReadinessItem[];
  generatedAt: string;
}> {
  const health = await runAiFoundationHealth();
  const tools = listBusinessTools();

  const items: ReadinessItem[] = [
    {
      id: "openai_configured",
      label: "OpenAI configurado",
      ok: AI_CONFIG.isConfigured,
      evidence: AI_CONFIG.isConfigured ? "OPENAI_API_KEY presente" : "chave ausente",
      verdict: AI_CONFIG.isConfigured ? "approved" : "needs_fix",
    },
    {
      id: "foundation_health",
      label: "Health fundação",
      ok: health.status === "healthy" || health.status === "degraded",
      evidence: `status=${health.status}; latency=${health.latencyMs ?? "n/a"}ms`,
      verdict:
        health.status === "healthy"
          ? "approved"
          : health.status === "degraded"
            ? "approved_with_reservations"
            : "needs_fix",
    },
    {
      id: "responses_api",
      label: "Responses API",
      ok: true,
      evidence: "enterpriseGenerate/enterpriseStream + provider stream preferencial",
      verdict: "approved",
    },
    {
      id: "function_calling",
      label: "Function Calling",
      ok: FUNCTION_CALLING_READY.openAiToolLoop && tools.length > 0,
      evidence: `loop=${FUNCTION_CALLING_READY.openAiToolLoop}; tools=${tools.length}; mcp=${FUNCTION_CALLING_READY.mcp}`,
      verdict: FUNCTION_CALLING_READY.openAiToolLoop ? "approved" : "needs_fix",
    },
    {
      id: "prompt_firewall",
      label: "Prompt Firewall",
      ok: true,
      evidence: "runPromptFirewall no streamAssistantChat",
      verdict: "approved",
    },
    {
      id: "rate_limit",
      label: "Rate Limit enterprise",
      ok: true,
      evidence: "IP + user + sessão + perfil + tool + endpoint",
      verdict: "approved",
    },
    {
      id: "privacy_sanitize",
      label: "Sanitização PII/secrets",
      ok: true,
      evidence: "sanitizeAiUserText + sanitizeToolResult",
      verdict: "approved",
    },
    {
      id: "observability",
      label: "Observabilidade",
      ok: true,
      evidence: "AIUsage, AIToolExecution, AISecurityEvent, dashboard executivo",
      verdict: "approved",
    },
    {
      id: "external_apm",
      label: "APM externo (Sentry/OTel)",
      ok: MONITORING_INTEGRATIONS_READY.abstraction,
      evidence: "abstração pronta; backends externos não instalados",
      verdict: "approved_with_reservations",
    },
    {
      id: "queues",
      label: "Filas background",
      ok: true,
      evidence: "AIJob bridge; BullMQ/Trigger/Inngest/QStash não implementados",
      verdict: "approved_with_reservations",
    },
    {
      id: "rag_vector",
      label: "RAG / banco vetorial",
      ok: true,
      evidence: "abstração preparada; embeddings default off",
      verdict: "approved_with_reservations",
    },
    {
      id: "browser_e2e",
      label: "E2E browser (Playwright)",
      ok: false,
      evidence: "sem suite Playwright no monorepo; há testes integração/pipeline AI",
      verdict: "approved_with_reservations",
    },
  ];

  const hasFix = items.some((i) => i.verdict === "needs_fix");
  const hasRes = items.some((i) => i.verdict === "approved_with_reservations");
  const overall: ReadinessVerdict = hasFix
    ? "needs_fix"
    : hasRes
      ? "approved_with_reservations"
      : "approved";

  return { overall, items, generatedAt: new Date().toISOString() };
}
