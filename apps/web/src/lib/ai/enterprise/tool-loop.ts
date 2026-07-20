/**
 * Loop operacional de Function Calling (Responses API / Completions).
 * Reutiliza registry/executor/permissions dos módulos (Prompt 3).
 */
import "server-only";

import type { UserRole } from "@prisma/client";
import type { AiLocale } from "@/lib/ai/ai-config";
import type { AiChatMessage } from "@/lib/ai/types";
import type { AssistantPersona } from "@/lib/ai/assistant/types";
import { listFunctionCallingSchemas, handleFunctionCall } from "@/lib/ai/modules/function-calling";
import { enrichPromptWithToolResults } from "@/lib/ai/modules/response-enricher";
import type { ToolExecutionResult } from "@/lib/ai/modules/types";
import { enterpriseGenerate } from "./openai-gateway";
import { logToolExecutions } from "./tool-execution-log";
import { resolveEnterpriseModel } from "./model-strategy";
import { assertToolRateLimit } from "./rate-limit-enterprise";

const MAX_ROUNDS = 2;
const MAX_TOOLS_PER_ROUND = 3;

export type ToolLoopResult = {
  toolResults: ToolExecutionResult[];
  toolsUsed: string[];
  enrichmentBlock: string;
  rounds: number;
  api: "responses" | "chat_completions" | "none";
  latencyMs: number;
};

export async function runFunctionCallingLoop(input: {
  userId: string;
  role: UserRole;
  persona: AssistantPersona;
  locale: AiLocale;
  messages: AiChatMessage[];
  conversationId?: string;
  confirmed?: boolean;
}): Promise<ToolLoopResult> {
  const started = Date.now();
  const schemas = listFunctionCallingSchemas(input.role);
  if (!schemas.length) {
    return {
      toolResults: [],
      toolsUsed: [],
      enrichmentBlock: "",
      rounds: 0,
      api: "none",
      latencyMs: 0,
    };
  }

  const allResults: ToolExecutionResult[] = [];
  let api: ToolLoopResult["api"] = "none";
  let messages = [...input.messages];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const gen = await enterpriseGenerate({
      messages,
      model: resolveEnterpriseModel("tools"),
      tools: schemas,
      purpose: "tools",
      temperature: 0.2,
      maxTokens: 800,
    });
    api = gen.api;

    if (!gen.toolCalls.length) {
      // Modelo respondeu em texto — não força tools
      break;
    }

    const calls = gen.toolCalls.slice(0, MAX_TOOLS_PER_ROUND);
    for (const call of calls) {
      assertToolRateLimit(input.userId, call.name);
      const result = await handleFunctionCall(
        { name: call.name, arguments: call.arguments },
        {
          userId: input.userId,
          role: input.role,
          persona: input.persona,
          locale: input.locale,
          confirmed: input.confirmed,
        }
      );

      const normalized: ToolExecutionResult =
        "toolName" in result
          ? result
          : {
              toolName: call.name as ToolExecutionResult["toolName"],
              executed: false,
              ok: false,
              error: "error" in result ? String(result.error) : "TOOL_ERROR",
              data: null,
              latencyMs: 0,
            };

      allResults.push(normalized);

      messages = [
        ...messages,
        {
          role: "assistant",
          content: `[tool_call:${call.name}]`,
        },
        {
          role: "user",
          content: `[tool_result:${call.name}]\n${JSON.stringify(normalized.data ?? { error: normalized.error }).slice(0, 2000)}`,
        },
      ];
    }

    // Uma rodada com tools já enriquece — evita cascata
    if (allResults.some((r) => r.executed && r.ok)) break;
  }

  await logToolExecutions(input.userId, input.conversationId, allResults);

  return {
    toolResults: allResults,
    toolsUsed: allResults.filter((r) => r.ok && r.executed).map((r) => r.toolName),
    enrichmentBlock: enrichPromptWithToolResults(allResults),
    rounds: allResults.length ? 1 : 0,
    api,
    latencyMs: Date.now() - started,
  };
}
