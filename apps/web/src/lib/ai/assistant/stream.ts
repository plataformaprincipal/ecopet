import "server-only";

import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { AI_CONFIG, normalizeLocale, type AiLocale } from "@/lib/ai/ai-config";
import { moderateContent, moderateAiOutput } from "@/lib/ai/ai-moderation";
import {
  createConversation,
  appendConversationMessage,
  saveMemory,
} from "@/lib/ai/memory/store";
import { recordAiUsage } from "@/lib/ai/ai-usage";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { recordAiSuccess, recordAiFailure } from "@/lib/ai/ai-rate-limit";
import {
  AiRuntimeError,
  AI_RUNTIME_ERROR_CODES,
  userFacingAiMessage,
} from "@/lib/ai/ai-errors";
import { bootstrapOpenAIProvider } from "@/lib/ai/bootstrap-openai";
import { prisma } from "@/lib/prisma";
import {
  buildBusinessContext,
  loadActiveConversationMemory,
  updateConversationSummary,
} from "@/lib/ai/modules";
import {
  runPromptFirewall,
  recordFirewallEvent,
  enforceEnterpriseLimits,
  runFunctionCallingLoop,
  enterpriseStream,
  logToolExecutions,
  trackAiMetric,
  trackAiError,
} from "@/lib/ai/enterprise";
import { resolveEnterpriseModel } from "@/lib/ai/enterprise/model-strategy";
import { resolveAssistantPersona } from "./personas";
import { assertAssistantAccess } from "./permissions";
import type { AssistantStreamEvent } from "./types";
import { isAiFlagEnabled, resolveEcoPetAgent } from "@/lib/ai/operational";

/**
 * Streaming do Assistente — business context (Prompt 3) + Enterprise (Prompt 4).
 * Responses API via enterpriseStream; FC loop operacional; Prompt Firewall.
 */
export async function* streamAssistantChat(input: {
  userId: string;
  role: UserRole;
  message: string;
  conversationId?: string;
  locale?: string;
  ip?: string;
  petId?: string;
  displayName?: string | null;
  pagePath?: string;
  module?: string;
}): AsyncGenerator<AssistantStreamEvent> {
  const started = Date.now();
  const locale: AiLocale = normalizeLocale(input.locale);
  const requestId = randomUUID();

  try {
    if (!AI_CONFIG.isConfigured) {
      yield {
        type: "error",
        code: AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED,
        message: userFacingAiMessage(AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED, locale),
      };
      return;
    }

    assertAssistantAccess(input.role);
    if (!isAiFlagEnabled("assistant")) {
      yield {
        type: "error",
        code: "AI_FLAG_DISABLED",
        message: "Assistente EcoPet IA temporariamente desativado.",
      };
      return;
    }
    await enforceEnterpriseLimits({
      userId: input.userId,
      role: input.role,
      ip: input.ip,
      conversationId: input.conversationId,
      endpoint: "assistant-stream",
    });
    bootstrapOpenAIProvider();

    const raw = input.message.trim().slice(0, AI_CONFIG.maxInputChars);
    if (!raw) {
      yield {
        type: "error",
        code: AI_RUNTIME_ERROR_CODES.CONTEXT_INSUFFICIENT,
        message: "Entrada vazia.",
      };
      return;
    }

    const firewall = runPromptFirewall(raw, { userId: input.userId });
    await recordFirewallEvent(input.userId, firewall);
    if (firewall.decision === "BLOCK") {
      yield {
        type: "error",
        code: "AI_FIREWALL_BLOCK",
        message: firewall.reason ?? "Entrada bloqueada por segurança.",
      };
      return;
    }

    const userText = firewall.sanitizedText;
    const moderation = await moderateContent(userText);
    if (moderation.decision === "BLOCK") {
      yield {
        type: "error",
        code: AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED,
        message: userFacingAiMessage(AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED, locale),
      };
      return;
    }

    const persona = resolveAssistantPersona(input.role);
    const agentPlan = resolveEcoPetAgent({
      role: input.role,
      pagePath: input.pagePath,
      moduleHint: input.module,
      message: userText,
    });

    yield {
      type: "status",
      phase: "context",
      agentId: agentPlan.agentId,
      disclaimer: agentPlan.disclaimer,
    };

    const business = await buildBusinessContext({
      userId: input.userId,
      role: input.role,
      persona,
      locale,
      message: userText,
      pagePath: input.pagePath,
      module: (input.module as never) ?? agentPlan.businessModule,
      petId: input.petId,
      conversationId: input.conversationId,
      displayName: input.displayName,
    });

    if (business.toolResults.length) {
      await logToolExecutions(
        input.userId,
        input.conversationId,
        business.toolResults,
        business.activeModule
      );
    }

    let conversationId = input.conversationId;
    if (!conversationId) {
      const conv = await createConversation({
        userId: input.userId,
        agentCode:
          persona === "PARTNER"
            ? "partner"
            : persona === "ONG"
              ? "ngo"
              : persona === "ADMIN"
                ? "admin"
                : "client",
        petId: input.petId,
        title: userText.slice(0, 80),
        module: "ecopet-ai",
        role: String(input.role),
        locale,
      });
      conversationId = conv.id;
    }

    await appendConversationMessage({
      conversationId,
      role: "user",
      content: userText,
    });

    const memory = await loadActiveConversationMemory({
      userId: input.userId,
      petId: input.petId,
      conversationId,
    });

    const history = memory.shortTerm;

    // Function Calling operacional (Responses API) — complemento ao intent router
    yield { type: "status", phase: "tools" };
    let fcEnrichment = "";
    let fcTools: string[] = [];
    if (agentPlan.flags.tools && isAiFlagEnabled("tools")) {
      try {
        const loop = await runFunctionCallingLoop({
          userId: input.userId,
          role: input.role,
          persona,
          locale,
          conversationId,
          messages: [
            { role: "system", content: business.systemPrompt },
            ...history,
            {
              role: "user",
              content: [
                userText,
                business.contextBlock
                  ? `\n\nContexto já disponível:\n${business.contextBlock.slice(0, 2500)}`
                  : "",
                "Se precisar de dados adicionais, use as ferramentas. Caso contrário, não chame tools.",
              ].join(""),
            },
          ],
        });
        fcEnrichment = loop.enrichmentBlock;
        fcTools = loop.toolsUsed;
      } catch {
        // FC falhou — segue com contexto intent-only
      }
    }

    const toolsUsed = [...new Set([...business.toolsUsed, ...fcTools])];
    if (toolsUsed.length) {
      yield { type: "tools", tools: toolsUsed };
    }

    const systemPrompt = [
      business.systemPrompt,
      business.contextBlock,
      fcEnrichment,
    ]
      .filter(Boolean)
      .join("\n\n");

    yield { type: "status", phase: "generating" };
    const model = resolveEnterpriseModel("chat");
    let assembled = "";

    for await (const chunk of enterpriseStream({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText },
      ],
      maxTokens: AI_CONFIG.maxOutputTokens,
      temperature: 0.6,
    })) {
      if (chunk.delta) {
        assembled += chunk.delta;
        yield { type: "delta", text: chunk.delta };
      }
    }

    const outMod = await moderateAiOutput(assembled);
    let content = assembled.trim();
    if (outMod.decision === "BLOCK") {
      content = userFacingAiMessage(AI_RUNTIME_ERROR_CODES.CONTENT_BLOCKED, locale);
    } else if (content && !content.includes(business.disclaimer.slice(0, 40))) {
      content = `${content}\n\n—\n${business.disclaimer}`;
    }

    const msg = await appendConversationMessage({
      conversationId,
      role: "assistant",
      content,
      tokensInput: 0,
      tokensOutput: 0,
    });

    await prisma.aIMessage
      .update({
        where: { id: msg.id },
        data: {
          metadata: {
            model,
            latencyMs: Date.now() - started,
            requestId,
            streamed: true,
            api: "responses_preferred",
            module: business.activeModule,
            toolsUsed,
            firewall: firewall.decision,
          },
        },
      })
      .catch(() => undefined);

    await saveMemory(
      {
        userId: input.userId,
        scope: "user",
        scopeOwnerId: input.userId,
        petId: input.petId,
        agentType: "client",
      },
      { userMessage: userText, assistantMessage: content, conversationId }
    );

    yield { type: "status", phase: "summary" };
    await updateConversationSummary({
      userId: input.userId,
      conversationId,
      userMessage: userText,
      assistantMessage: content,
      petId: input.petId,
    }).catch(() => undefined);

    await recordAiUsage({
      userId: input.userId,
      role: input.role,
      module: "ecopet-ai",
      model,
      inputTokens: business.estimatedTokens,
      outputTokens: Math.max(1, Math.ceil(content.length / 4)),
      requestId,
      success: outMod.decision !== "BLOCK",
    }).catch(() => undefined);

    await writeAiAuditLog({
      userId: input.userId,
      role: input.role,
      module: "ecopet-ai",
      action: "assistant-stream",
      decision: "ALLOW",
      metadata: {
        requestId,
        streamed: true,
        businessModule: business.activeModule,
        toolsUsed,
        enterprise: true,
        agentId: agentPlan.agentId,
      },
    }).catch(() => undefined);

    recordAiSuccess();
    const latencyMs = Date.now() - started;
    trackAiMetric("assistant.stream.latency_ms", latencyMs, {
      module: business.activeModule,
      role: String(input.role),
    });
    trackAiMetric("assistant.stream.tools", toolsUsed.length, {
      module: business.activeModule,
    });
    yield {
      type: "done",
      conversationId,
      messageId: msg.id,
      content,
      model,
      latencyMs,
      module: business.activeModule,
      toolsUsed,
      agentId: agentPlan.agentId,
    };
  } catch (e) {
    recordAiFailure();
    trackAiError("assistant.stream.error", {
      code: e instanceof AiRuntimeError ? e.code : "AI_ERROR",
    });
    if (e instanceof AiRuntimeError) {
      yield { type: "error", code: e.code, message: e.message };
      return;
    }
    const code = (e as Error & { code?: string })?.code;
    if (code === "AI_FIREWALL_BLOCK") {
      yield {
        type: "error",
        code,
        message: e instanceof Error ? e.message : "Bloqueado pelo firewall.",
      };
      return;
    }
    yield {
      type: "error",
      code: "AI_ERROR",
      message: e instanceof Error ? e.message.slice(0, 160) : "Falha no assistente.",
    };
  }
}
