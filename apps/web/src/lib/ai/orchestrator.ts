import {
  AI_ERROR_CODES,
  AI_PROVIDER_NOT_CONFIGURED_MESSAGE,
  AiProviderNotConfiguredError,
} from "@/lib/ai/errors";
import type { AiAgentId, AiMemoryScope, OrchestratorRequest, OrchestratorResponse } from "@/lib/ai/types";
import { getAgent, resolveAgentModel } from "@/lib/ai/registry";
import { getPrompt } from "@/lib/ai/prompts/registry";
import { resolveAgentForRequest, assertAgentAccess } from "@/lib/ai/permissions";
import {
  loadMemory,
  saveMemory,
  createConversation,
  appendConversationMessage,
} from "@/lib/ai/memory/store";
import { moderateInput } from "@/lib/ai/moderation";
import { listToolsForAgent } from "@/lib/ai/tools/registry";
import { getAIProvider } from "@/lib/ai/provider";
import { writeAiPlatformLog } from "@/lib/ai/logs/service";
import { estimateUsage } from "@/lib/ai/utils/tokens";
import { estimateCostUsd } from "@/lib/ai/utils/cost";
import { durationSince } from "@/lib/ai/utils/timing";
import { bootstrapAiPlatform } from "@/lib/ai/db/bootstrap";

function resolveMemoryScope(agentId: AiAgentId, request: OrchestratorRequest): AiMemoryScope {
  if (request.petId && agentId === "pet") return "pet";
  if (request.partnerId && agentId === "partner") return "partner";
  if (request.ngoId && agentId === "ngo") return "ngo";
  if (agentId === "admin") return "admin";
  return "user";
}

function buildContext(systemPrompt: string, memory: { summary: string; history: { role: string; content: string }[] }, message: string) {
  const historyText = memory.history
    .slice(-6)
    .map((h) => `${h.role}: ${h.content}`)
    .join("\n");
  return [
    systemPrompt,
    memory.summary ? `Resumo: ${memory.summary}` : "",
    historyText ? `Histórico:\n${historyText}` : "",
    `Usuário: ${message}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function detectIntent(message: string, fallback: AiAgentId): AiAgentId {
  const lower = message.toLowerCase();
  if (/\b(marketplace|produto|compra|loja)\b/.test(lower)) return "marketplace";
  if (/\b(pet|meu pet|cachorro|gato)\b/.test(lower)) return "pet";
  if (/\b(veterin|saúde|vacina)\b/.test(lower)) return "veterinarian";
  if (/\b(suporte|ajuda|problema|ticket)\b/.test(lower)) return "support";
  if (/\b(relatório|métrica|analytics|dados)\b/.test(lower)) return "analytics";
  return fallback;
}

export async function runOrchestrator(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  await bootstrapAiPlatform();
  const started = Date.now();
  const provider = getAIProvider();

  let agentId = resolveAgentForRequest({
    role: request.role,
    agentId: request.agentId,
    integrationPoint: request.integrationPoint,
  });

  if (!agentId) {
    return failResponse("client", started, "AGENT_FORBIDDEN", "Agente não permitido para este perfil.");
  }

  if (!request.agentId && !request.integrationPoint) {
    agentId = detectIntent(request.message, agentId);
    if (!resolveAgentForRequest({ role: request.role, agentId })) {
      agentId = resolveAgentForRequest({ role: request.role }) ?? agentId;
    }
  }

  try {
    assertAgentAccess(request.role, agentId);
  } catch {
    return failResponse(agentId, started, "AGENT_FORBIDDEN", "Sem permissão para este agente.");
  }

  const agent = getAgent(agentId)!;
  const promptDef = getPrompt(agent.promptKey, agent.promptVersion);
  const model = resolveAgentModel(agentId);
  const moderation = await moderateInput(request.message);

  if (!moderation.allowed) {
    const durationMs = durationSince(started);
    await logRequest(request, agentId, model.id, model.provider, request.message, null, estimateUsage(request.message, ""), durationMs, 0, "MODERATION_BLOCKED", moderation.reason);
    return failResponse(agentId, started, "MODERATION_BLOCKED", moderation.reason ?? "Conteúdo bloqueado.", model.id, model.provider, agent.promptVersion);
  }

  const memoryScope = resolveMemoryScope(agentId, request);
  const scopeOwnerId =
    memoryScope === "pet" ? request.petId ?? request.userId
    : memoryScope === "partner" ? request.partnerId ?? request.userId
    : memoryScope === "ngo" ? request.ngoId ?? request.userId
    : request.userId;

  const memory = await loadMemory({
    userId: request.userId,
    scope: memoryScope,
    scopeOwnerId,
    petId: request.petId,
    agentType: agentId,
  });

  const systemPrompt = promptDef?.content ?? "Você é o assistente EcoPet.";
  const fullPrompt = buildContext(systemPrompt, memory, request.message);
  const availableTools = listToolsForAgent(agentId, request.role);

  const conversation = await createConversation({
    userId: request.userId,
    agentCode: agentId,
    petId: request.petId,
    title: request.message.slice(0, 80),
  });

  await appendConversationMessage({
    conversationId: conversation.id,
    role: "user",
    content: request.message,
  });

  let content: string | null = null;
  let usage = estimateUsage(fullPrompt, "");
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  try {
    const result = await provider.generateResponse({
      model: model.id,
      messages: [
        { role: "system", content: fullPrompt },
        { role: "user", content: request.message },
      ],
      maxTokens: model.maxTokens,
      temperature: agent.temperature,
      metadata: { agentId, tools: availableTools.map((t) => t.id).join(",") },
    });
    content = result.content;
    usage = result.usage;
  } catch (e) {
    if (e instanceof AiProviderNotConfiguredError) {
      errorCode = AI_ERROR_CODES.PROVIDER_NOT_CONFIGURED;
      errorMessage = AI_PROVIDER_NOT_CONFIGURED_MESSAGE;
    } else {
      errorCode = AI_ERROR_CODES.AI_ERROR;
      errorMessage = e instanceof Error ? e.message : "Erro na IA.";
    }
  }

  const durationMs = durationSince(started);
  const estimatedCostUsd = estimateCostUsd(model, usage);

  if (content) {
    await appendConversationMessage({
      conversationId: conversation.id,
      role: "assistant",
      content,
      tokensInput: usage.promptTokens,
      tokensOutput: usage.completionTokens,
    });
  }

  const sessionId = await saveMemory(
    {
      userId: request.userId,
      scope: memoryScope,
      scopeOwnerId,
      petId: request.petId,
      agentType: agentId,
    },
    { userMessage: request.message, assistantMessage: content, conversationId: conversation.id }
  );

  await logRequest(
    request,
    agentId,
    model.id,
    model.provider,
    fullPrompt,
    content,
    usage,
    durationMs,
    estimatedCostUsd,
    errorCode,
    errorMessage,
    conversation.id
  );

  return {
    success: !errorCode,
    agentId,
    model: model.id,
    provider: model.provider,
    content,
    promptVersion: agent.promptVersion,
    error: errorCode ? { code: errorCode, message: errorMessage ?? "Erro." } : undefined,
    usage,
    durationMs,
    estimatedCostUsd,
    sessionId,
    conversationId: conversation.id,
  };
}

async function logRequest(
  request: OrchestratorRequest,
  agentId: AiAgentId,
  model: string,
  provider: OrchestratorResponse["provider"],
  prompt: string,
  response: string | null,
  usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  durationMs: number,
  estimatedCostUsd: number,
  errorCode?: string,
  errorMessage?: string,
  conversationId?: string
) {
  await writeAiPlatformLog({
    userId: request.userId,
    agentId,
    model,
    provider,
    prompt,
    response,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    durationMs,
    estimatedCostUsd,
    errorCode,
    errorMessage,
    conversationId,
    metadata: { integrationPoint: request.integrationPoint },
  });
}

function failResponse(
  agentId: AiAgentId,
  started: number,
  code: string,
  message: string,
  model = "",
  provider: OrchestratorResponse["provider"] = "openai",
  promptVersion = ""
): OrchestratorResponse {
  return {
    success: false,
    agentId,
    model,
    provider,
    content: null,
    promptVersion,
    error: { code, message },
    durationMs: durationSince(started),
    estimatedCostUsd: 0,
  };
}
