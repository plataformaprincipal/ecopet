/**
 * Gateway central OpenAI — Responses API preferencial.
 * Único ponto enterprise para generate/stream com tools.
 * Não espalhar client.responses / chat.completions fora daqui ou do provider legado.
 */
import "server-only";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { sanitizeAiMessages } from "@/lib/ai/utils/sanitize-input";
import { withRetry } from "@/lib/ai/utils/retry";
import { recordAiSuccess, recordAiFailure } from "@/lib/ai/ai-rate-limit";
import { AiRuntimeError, AI_RUNTIME_ERROR_CODES } from "@/lib/ai/ai-errors";
import type { AiChatMessage, AiStreamChunk } from "@/lib/ai/types";
import type { OpenAiToolSchema } from "@/lib/ai/modules/types";
import { resolveEnterpriseModel } from "./model-strategy";
import type { EnterpriseGenerateWithToolsResult, EnterpriseToolCall } from "./types";

function assertConfigured() {
  if (!AI_CONFIG.isConfigured || !AI_CONFIG.apiKey) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED,
      "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.",
      503
    );
  }
}

function toResponsesTools(tools: OpenAiToolSchema[]) {
  return tools.map((t) => ({
    type: "function" as const,
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters as Record<string, unknown>,
    strict: false as const,
  }));
}

function extractResponsesText(response: unknown): string {
  const r = response as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  if (r.output_text?.trim()) return r.output_text.trim();
  const parts: string[] = [];
  for (const item of r.output ?? []) {
    for (const c of item.content ?? []) {
      if ((c.type === "output_text" || c.type === "text") && c.text) parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

function extractFunctionCalls(response: unknown): EnterpriseToolCall[] {
  const r = response as {
    output?: Array<{
      type?: string;
      id?: string;
      call_id?: string;
      name?: string;
      arguments?: string;
    }>;
  };
  const calls: EnterpriseToolCall[] = [];
  for (const item of r.output ?? []) {
    if (item.type === "function_call" && item.name) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(item.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      calls.push({
        callId: item.call_id || item.id || `call_${calls.length}`,
        name: item.name,
        arguments: args,
      });
    }
  }
  return calls;
}

/** Generate via Responses API (tools opcionais) com fallback Chat Completions. */
export async function enterpriseGenerate(input: {
  messages: AiChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: OpenAiToolSchema[];
  purpose?: "chat" | "tools";
}): Promise<EnterpriseGenerateWithToolsResult> {
  assertConfigured();
  const started = Date.now();
  const client = getOpenAIClient();
  const model = input.model || resolveEnterpriseModel(input.purpose ?? "chat");
  const maxTokens = input.maxTokens ?? AI_CONFIG.maxOutputTokens;
  const { messages: safeMessages } = sanitizeAiMessages(input.messages);

  try {
    if (typeof (client as { responses?: { create: Function } }).responses?.create === "function") {
      const response = await withRetry(
        async () =>
          client.responses.create({
            model,
            input: safeMessages.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
            })),
            max_output_tokens: maxTokens,
            temperature: input.temperature ?? 0.6,
            ...(input.tools?.length
              ? { tools: toResponsesTools(input.tools) as never }
              : {}),
          } as never),
        { maxAttempts: AI_CONFIG.maxRetries, baseDelayMs: AI_CONFIG.retryBaseDelayMs }
      );

      const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
      recordAiSuccess();
      return {
        content: extractResponsesText(response),
        model,
        usage: {
          promptTokens: usage?.input_tokens ?? 0,
          completionTokens: usage?.output_tokens ?? 0,
          totalTokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
        },
        toolCalls: extractFunctionCalls(response),
        rounds: 1,
        latencyMs: Date.now() - started,
        api: "responses",
      };
    }
  } catch (e) {
    if (e instanceof AiRuntimeError) throw e;
  }

  // Fallback Chat Completions (+ tools se suportado)
  try {
    const completion = await withRetry(
      async () =>
        client.chat.completions.create({
          model,
          messages: safeMessages.map((m) => ({
            role: m.role as "system" | "user" | "assistant",
            content: m.content,
          })),
          max_tokens: maxTokens,
          temperature: input.temperature ?? 0.6,
          ...(input.tools?.length
            ? {
                tools: input.tools.map((t) => ({
                  type: "function" as const,
                  function: t.function,
                })),
              }
            : {}),
        }),
      { maxAttempts: AI_CONFIG.maxRetries, baseDelayMs: AI_CONFIG.retryBaseDelayMs }
    );

    const msg = completion.choices[0]?.message;
    const toolCalls: EnterpriseToolCall[] = (msg?.tool_calls ?? []).map((tc, i) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function?.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return {
        callId: tc.id || `call_${i}`,
        name: tc.function?.name || "unknown",
        arguments: args,
      };
    });

    recordAiSuccess();
    return {
      content: msg?.content?.trim() ?? "",
      model: completion.model ?? model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
      toolCalls,
      rounds: 1,
      latencyMs: Date.now() - started,
      api: "chat_completions",
    };
  } catch (e) {
    recordAiFailure();
    throw e;
  }
}

/**
 * Stream preferindo Responses API; fallback Chat Completions.
 */
export async function* enterpriseStream(input: {
  messages: AiChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): AsyncGenerator<AiStreamChunk> {
  assertConfigured();
  const client = getOpenAIClient();
  const model = input.model || resolveEnterpriseModel("chat");
  const { messages: safeMessages } = sanitizeAiMessages(input.messages);

  // Responses streaming
  try {
    if (typeof client.responses?.create === "function") {
      const stream = (await client.responses.create({
        model,
        input: safeMessages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        max_output_tokens: input.maxTokens ?? AI_CONFIG.maxOutputTokens,
        temperature: input.temperature ?? 0.6,
        stream: true,
      })) as unknown as AsyncIterable<{ type?: string; delta?: string }>;

      for await (const event of stream) {
        const e = event;
        if (typeof e.delta === "string" && e.delta && (e.type?.includes("delta") ?? false)) {
          yield { delta: e.delta };
        }
      }
      yield { delta: "", done: true };
      return;
    }
  } catch {
    // fallback abaixo
  }

  const stream = await client.chat.completions.create({
    model,
    messages: safeMessages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    max_tokens: input.maxTokens ?? AI_CONFIG.maxOutputTokens,
    temperature: input.temperature ?? 0.6,
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) yield { delta };
  }
  yield { delta: "", done: true };
}
