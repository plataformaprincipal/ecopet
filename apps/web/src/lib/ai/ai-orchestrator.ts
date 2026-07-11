import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import type { AiModule, AiLocale } from "@/lib/ai/ai-config";
import { AI_CONFIG, normalizeLocale } from "@/lib/ai/ai-config";
import { canAccessModule, requiresExplicitConfirmation } from "@/lib/ai/ai-policy";
import { enforceAiLimits, recordAiFailure, recordAiSuccess } from "@/lib/ai/ai-rate-limit";
import { buildMinimalContext, type AiContextEntityIds } from "@/lib/ai/ai-context";
import { getModuleSystemPrompt, getActionPrompt } from "@/lib/ai/ai-prompts";
import { moderateContent, moderateAiOutput } from "@/lib/ai/ai-moderation";
import { getAIProvider } from "@/lib/ai/provider";
import { recordAiUsage } from "@/lib/ai/ai-usage";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { AiRuntimeError, AI_RUNTIME_ERROR_CODES, userFacingAiMessage } from "@/lib/ai/ai-errors";
import {
  createConversation,
  appendConversationMessage,
  loadMemory,
  saveMemory,
} from "@/lib/ai/memory/store";
import { prisma } from "@/lib/prisma";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import type { AiAgentId, AiIntegrationPointId } from "@/lib/ai/types";

export type RunEcoPetAIInput = {
  userId: string;
  role: UserRole;
  module: AiModule;
  action: string;
  input: string;
  locale?: string;
  entityIds?: AiContextEntityIds;
  conversationId?: string;
  confirmed?: boolean;
  agentId?: AiAgentId;
  integrationPoint?: AiIntegrationPointId;
};

export type RunEcoPetAIResult = {
  success: boolean;
  content: string | null;
  conversationId?: string;
  messageId?: string;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd?: number;
  latencyMs: number;
  safetyStatus: "ALLOW" | "REVIEW" | "BLOCK";
  requiresConfirmation?: boolean;
  disclaimer: string;
  error?: { code: string; message: string };
  /** Compat legado UI que espera `reply` */
  reply?: string | null;
};

const MODULE_TO_AGENT: Partial<Record<AiModule, AiAgentId>> = {
  "ecopet-ai": "client",
  profile: "client",
  pets: "pet",
  marketplace: "marketplace",
  products: "marketplace",
  services: "marketplace",
  appointments: "client",
  orders: "commercial",
  cart: "commercial",
  partner: "partner",
  ong: "ngo",
  social: "marketing",
  messages: "support",
  notifications: "support",
  search: "analytics",
  support: "support",
  admin: "admin",
  moderation: "admin",
  reports: "analytics",
  recommendations: "marketplace",
};

/**
 * Orquestrador central EcoPet AI.
 * Minimização de dados · permissões · moderação · limites · auditoria.
 */
export async function runEcoPetAI(params: RunEcoPetAIInput): Promise<RunEcoPetAIResult> {
  const started = Date.now();
  const locale: AiLocale = normalizeLocale(params.locale);
  const requestId = randomUUID();

  try {
    if (!params.userId) {
      throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.SESSION_MISSING, "Sessão ausente.", 401);
    }
    if (!canAccessModule(params.role, params.module)) {
      throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.PERSONA_INVALID, "Persona sem acesso ao módulo.", 403);
    }
    if (requiresExplicitConfirmation(params.action) && !params.confirmed) {
      await writeAiAuditLog({
        userId: params.userId,
        role: params.role,
        module: params.module,
        action: params.action,
        decision: "CONFIRM_REQUIRED",
      });
      return {
        success: false,
        content: null,
        reply: null,
        latencyMs: Date.now() - started,
        safetyStatus: "ALLOW",
        requiresConfirmation: true,
        disclaimer: "",
        error: {
          code: AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED,
          message: userFacingAiMessage(AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED, locale),
        },
      };
    }

    await enforceAiLimits(params.userId);

    const input = params.input.trim().slice(0, AI_CONFIG.maxInputChars);
    if (!input) {
      throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.CONTEXT_INSUFFICIENT, "Entrada vazia.", 400);
    }

    const moderation = await moderateContent(input);
    if (moderation.decision === "BLOCK") {
      await writeAiAuditLog({
        userId: params.userId,
        role: params.role,
        module: params.module,
        action: params.action,
        decision: "DENY",
        metadata: { categories: moderation.categories },
      });
      await recordAiUsage({
        userId: params.userId,
        role: params.role,
        module: params.module,
        model: AI_CONFIG.model,
        inputTokens: 0,
        outputTokens: 0,
        requestId,
        success: false,
        errorCode: AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED,
      });
      return {
        success: false,
        content: null,
        reply: null,
        latencyMs: Date.now() - started,
        safetyStatus: "BLOCK",
        disclaimer: "",
        error: {
          code: AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED,
          message: userFacingAiMessage(AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED, locale),
        },
      };
    }

    const ctx = await buildMinimalContext({
      userId: params.userId,
      role: params.role,
      module: params.module,
      locale,
      entityIds: params.entityIds,
    });

    const systemPrompt = [
      getModuleSystemPrompt(params.module, locale),
      getActionPrompt(params.action),
      ctx.text,
    ].join("\n\n");

    let conversationId = params.conversationId;
    if (!conversationId && params.action === "chat") {
    const conv = await createConversation({
      userId: params.userId,
      agentCode: MODULE_TO_AGENT[params.module] ?? "client",
      petId: params.entityIds?.petId,
      title: input.slice(0, 80),
      module: params.module,
      role: String(params.role),
      locale,
    });
    conversationId = conv.id;
    }

    if (conversationId) {
      await appendConversationMessage({
        conversationId,
        role: "user",
        content: input,
      });
    }

    const memory = await loadMemory({
      userId: params.userId,
      scope: "user",
      scopeOwnerId: params.userId,
      petId: params.entityIds?.petId,
      agentType: MODULE_TO_AGENT[params.module] ?? "client",
    });

    const history = memory.history.slice(-AI_CONFIG.maxHistoryMessages).map((h) => ({
      role: h.role as "user" | "assistant" | "system",
      content: h.content,
    }));

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      model: AI_CONFIG.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: input },
      ],
      maxTokens: AI_CONFIG.maxOutputTokens,
      temperature: 0.6,
      metadata: { module: params.module, action: params.action, requestId },
    });

    const outMod = await moderateAiOutput(result.content);
    let content = result.content;
    let safetyStatus: "ALLOW" | "REVIEW" | "BLOCK" =
      moderation.decision === "REVIEW" || outMod.decision === "REVIEW" ? "REVIEW" : "ALLOW";

    if (outMod.decision === "BLOCK") {
      content = userFacingAiMessage(AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED, locale);
      safetyStatus = "BLOCK";
    }

    // Anexa disclaimer em módulos de saúde/pet
    if (["pets", "ecopet-ai", "support"].includes(params.module) && content && !content.includes(ctx.disclaimer.slice(0, 40))) {
      content = `${content}\n\n—\n${ctx.disclaimer}`;
    }

    let messageId: string | undefined;
    if (conversationId && content) {
      const msg = await appendConversationMessage({
        conversationId,
        role: "assistant",
        content,
        tokensInput: result.usage.promptTokens,
        tokensOutput: result.usage.completionTokens,
      });
      messageId = msg.id;
      await prisma.aIMessage
        .update({
          where: { id: msg.id },
          data: {
            metadata: {
              model: result.model,
              latencyMs: Date.now() - started,
              safetyStatus,
              requestId,
            },
          },
        })
        .catch(() => undefined);
    }

    await saveMemory(
      {
        userId: params.userId,
        scope: "user",
        scopeOwnerId: params.userId,
        petId: params.entityIds?.petId,
        agentType: MODULE_TO_AGENT[params.module] ?? "client",
      },
      { userMessage: input, assistantMessage: content, conversationId }
    );

    const { estimatedCost } = await recordAiUsage({
      userId: params.userId,
      role: params.role,
      module: params.module,
      model: result.model,
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      requestId,
      success: safetyStatus !== "BLOCK",
      errorCode: safetyStatus === "BLOCK" ? AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED : null,
    });

    await writeAiAuditLog({
      userId: params.userId,
      role: params.role,
      module: params.module,
      action: params.action,
      entityType: params.entityIds ? Object.keys(params.entityIds)[0] : null,
      entityId: params.entityIds ? Object.values(params.entityIds).find(Boolean) ?? null : null,
      decision: safetyStatus === "BLOCK" ? "DENY" : safetyStatus === "REVIEW" ? "REVIEW" : "ALLOW",
      metadata: { requestId, model: result.model },
    });

    recordAiSuccess();

    return {
      success: safetyStatus !== "BLOCK",
      content,
      reply: content,
      conversationId,
      messageId,
      model: result.model,
      usage: result.usage,
      estimatedCostUsd: estimatedCost,
      latencyMs: Date.now() - started,
      safetyStatus,
      disclaimer: ctx.disclaimer,
    };
  } catch (e) {
    recordAiFailure();
    const code =
      e instanceof AiRuntimeError
        ? e.code
        : e instanceof Error && /timeout|AbortError/i.test(e.message)
          ? AI_RUNTIME_ERROR_CODES.TIMEOUT
          : AI_RUNTIME_ERROR_CODES.UNAVAILABLE;
    const status = e instanceof AiRuntimeError ? e.status : 503;
    await recordAiUsage({
      userId: params.userId,
      role: params.role,
      module: params.module,
      model: AI_CONFIG.model,
      inputTokens: 0,
      outputTokens: 0,
      requestId,
      success: false,
      errorCode: code,
    }).catch(() => undefined);
    await writeAiAuditLog({
      userId: params.userId,
      role: params.role,
      module: params.module,
      action: params.action,
      decision: "DENY",
      metadata: { code, status },
    });
    return {
      success: false,
      content: null,
      reply: null,
      latencyMs: Date.now() - started,
      safetyStatus: "ALLOW",
      disclaimer: "",
      error: { code, message: userFacingAiMessage(code, locale) },
    };
  }
}

/** Ponte para o orquestrador legado de agentes. */
export async function runEcoPetAIViaLegacyAgents(params: {
  userId: string;
  role: UserRole;
  message: string;
  agentId?: AiAgentId;
  petId?: string;
  integrationPoint?: AiIntegrationPointId;
}) {
  return runOrchestrator({
    userId: params.userId,
    role: params.role,
    message: params.message,
    agentId: params.agentId,
    petId: params.petId,
    integrationPoint: params.integrationPoint,
  });
}
