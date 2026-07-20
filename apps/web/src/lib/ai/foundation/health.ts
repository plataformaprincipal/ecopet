import "server-only";

import { AI_CONFIG } from "@/lib/ai/ai-config";
import { getOpenAIClient, resetOpenAIClientForTests } from "@/lib/ai/openai-client";
import { getAIProvider, getAiStatus } from "@/lib/ai/provider";
import { AI_MODEL_REGISTRY } from "@/lib/ai/models/registry";
import { maskSecretPreview } from "@/lib/ai/foundation/mask";
import { buildPrompt } from "@/lib/ai/utils/prompt-builder";
import { sanitizeAiUserText } from "@/lib/ai/utils/sanitize-input";
import { withRetry } from "@/lib/ai/utils/retry";
import { parseAiTextResponse } from "@/lib/ai/utils/response-parser";

export type AiFoundationCheck = {
  id: string;
  ok: boolean;
  detail: string;
};

export function getAiFoundationStatus() {
  const status = getAiStatus();
  return {
    configured: AI_CONFIG.isConfigured,
    globallyEnabled: AI_CONFIG.globallyEnabled,
    apiKeyPresent: Boolean(AI_CONFIG.apiKey),
    apiKeyMasked: maskSecretPreview(AI_CONFIG.apiKey),
    projectIdPresent: Boolean(AI_CONFIG.projectId),
    projectIdMasked: maskSecretPreview(AI_CONFIG.projectId),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    defaultModel: AI_CONFIG.model,
    embeddingModel: AI_CONFIG.embeddingModel,
    moderationModel: AI_CONFIG.moderationModel,
    timeoutMs: AI_CONFIG.requestTimeoutMs,
    maxRetries: AI_CONFIG.maxRetries,
    providerReady: status.ready,
    providers: {
      openai: status.openai,
      anthropic: status.anthropic,
      google: status.google,
    },
    notes: [
      "Não armazenar prompts/respostas integrais.",
      "OPENAI_API_KEY nunca retornada em claro.",
      "Features de domínio (assistente/marketplace) fora do escopo desta fundação.",
    ],
  };
}

export async function runAiFoundationHealth(): Promise<{
  status: "healthy" | "degraded" | "unhealthy" | "not_configured";
  checks: AiFoundationCheck[];
  latencyMs: number | null;
}> {
  const checks: AiFoundationCheck[] = [];
  const started = Date.now();

  checks.push({
    id: "API_KEY",
    ok: Boolean(AI_CONFIG.apiKey),
    detail: AI_CONFIG.apiKey ? "presente" : "ausente",
  });
  checks.push({
    id: "PROJECT_ID",
    ok: true,
    detail: AI_CONFIG.projectId ? "presente" : "opcional ausente",
  });
  checks.push({
    id: "GLOBALLY_ENABLED",
    ok: AI_CONFIG.globallyEnabled,
    detail: AI_CONFIG.globallyEnabled ? "on" : "AI_ENABLED=false ou OPENAI_PAUSED",
  });
  checks.push({
    id: "CLIENT_SINGLETON",
    ok: true,
    detail: "getOpenAIClient()",
  });
  checks.push({
    id: "TIMEOUT",
    ok: AI_CONFIG.requestTimeoutMs > 0,
    detail: `${AI_CONFIG.requestTimeoutMs}ms`,
  });
  checks.push({
    id: "RETRY",
    ok: AI_CONFIG.maxRetries >= 1,
    detail: `maxRetries=${AI_CONFIG.maxRetries}`,
  });
  checks.push({
    id: "MODEL_REGISTRY",
    ok: Object.keys(AI_MODEL_REGISTRY).length > 0,
    detail: `${Object.keys(AI_MODEL_REGISTRY).length} modelos`,
  });

  let latencyMs: number | null = null;
  if (!AI_CONFIG.isConfigured) {
    return {
      status: "not_configured",
      checks,
      latencyMs: null,
    };
  }

  try {
    const provider = getAIProvider();
    const hc = await provider.healthCheck();
    latencyMs = hc.latencyMs ?? Date.now() - started;
    checks.push({
      id: "OPENAI_REACHABLE",
      ok: hc.ok,
      detail: hc.ok ? `ok ${latencyMs}ms` : hc.message ?? "falha",
    });
  } catch (e) {
    checks.push({
      id: "OPENAI_REACHABLE",
      ok: false,
      detail: e instanceof Error ? e.message.slice(0, 120) : "erro",
    });
  }

  const failed = checks.filter((c) => !c.ok);
  const status =
    failed.length === 0
      ? "healthy"
      : checks.find((c) => c.id === "OPENAI_REACHABLE")?.ok === false
        ? "unhealthy"
        : "degraded";

  return { status, checks, latencyMs };
}

export function runAiFoundationDiagnostics() {
  const status = getAiFoundationStatus();
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];

  if (!status.apiKeyPresent) errors.push("OPENAI_API_KEY ausente");
  if (!status.globallyEnabled) warnings.push("IA globalmente desabilitada ou pausada");
  if (!status.projectIdPresent) {
    recommendations.push("Definir OPENAI_PROJECT_ID se a organização OpenAI exigir project scoping.");
  }
  if (status.timeoutMs < 5_000) warnings.push("Timeout muito baixo (<5s)");
  recommendations.push("Validar smoke em /admin/ai/foundation e integração OpenAI no hub.");
  recommendations.push("Não logar prompts/respostas completas.");

  return {
    environment: status.environment,
    timestamp: new Date().toISOString(),
    status,
    warnings,
    errors,
    recommendations,
  };
}

/**
 * Chamada mínima de teste (1 pergunta curta) — admin only via API.
 * Não usa streaming; sanitiza input; não persiste prompt.
 */
export async function runAiFoundationSmokeTest(): Promise<{
  ok: boolean;
  model: string;
  latencyMs: number;
  preview: string;
  redacted: string[];
  errorCode?: string;
}> {
  if (!AI_CONFIG.isConfigured) {
    return {
      ok: false,
      model: AI_CONFIG.model,
      latencyMs: 0,
      preview: "",
      redacted: [],
      errorCode: "AI_NOT_CONFIGURED",
    };
  }

  const prompt = buildPrompt({
    module: "foundation",
    user: "Responda apenas: OK",
  });
  const sanitized = sanitizeAiUserText(prompt.user);
  const started = Date.now();

  try {
    // Garante cliente com projectId atualizado
    resetOpenAIClientForTests();
    const client = getOpenAIClient();
    const completion = await withRetry(
      () =>
        client.chat.completions.create({
          model: AI_CONFIG.model,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: sanitized.text },
          ],
          max_tokens: 8,
          temperature: 0,
        }),
      { maxAttempts: AI_CONFIG.maxRetries, baseDelayMs: AI_CONFIG.retryBaseDelayMs }
    );
    const parsed = parseAiTextResponse(completion.choices[0]?.message?.content ?? "");
    return {
      ok: true,
      model: completion.model ?? AI_CONFIG.model,
      latencyMs: Date.now() - started,
      preview: parsed.preview,
      redacted: sanitized.redacted,
    };
  } catch (e) {
    return {
      ok: false,
      model: AI_CONFIG.model,
      latencyMs: Date.now() - started,
      preview: "",
      redacted: sanitized.redacted,
      errorCode: e instanceof Error ? e.name : "AI_SMOKE_FAILED",
    };
  }
}
