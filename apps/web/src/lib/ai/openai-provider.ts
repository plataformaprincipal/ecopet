import type { AIProvider } from "@/lib/ai/provider";
import type {
  AiEmbedInput,
  AiEmbedResult,
  AiGenerateInput,
  AiGenerateResult,
  AiHealthCheckResult,
  AiModerateInput,
  AiModerateResult,
  AiModelInfo,
  AiStreamChunk,
} from "@/lib/ai/types";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { createEmbeddings } from "@/lib/ai/ai-embeddings";
import { moderateContent } from "@/lib/ai/ai-moderation";
import { AI_MODEL_REGISTRY } from "@/lib/ai/models/registry";
import { recordAiSuccess, recordAiFailure } from "@/lib/ai/ai-rate-limit";
import { AiRuntimeError, AI_RUNTIME_ERROR_CODES } from "@/lib/ai/ai-errors";

/**
 * Provider OpenAI — Responses API como interface principal,
 * com fallback para Chat Completions.
 */
export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI";

  private assertConfigured(): void {
    if (!AI_CONFIG.isConfigured || !AI_CONFIG.apiKey) {
      throw new AiRuntimeError(
        AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED,
        "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.",
        503
      );
    }
  }

  async generateResponse(input: AiGenerateInput): Promise<AiGenerateResult> {
    this.assertConfigured();
    const client = getOpenAIClient();
    const model = input.model || AI_CONFIG.model;
    const maxTokens = input.maxTokens ?? AI_CONFIG.maxOutputTokens;

    try {
      // Responses API (preferencial)
      if (typeof (client as { responses?: { create: Function } }).responses?.create === "function") {
        const inputMessages = input.messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        }));
        const response = await client.responses.create({
          model,
          input: inputMessages,
          max_output_tokens: maxTokens,
          temperature: input.temperature ?? 0.7,
        });
        const content =
          (response as { output_text?: string }).output_text?.trim() ||
          extractResponsesText(response) ||
          "";
        const usage = (response as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
        recordAiSuccess();
        return {
          provider: this.id,
          model,
          content,
          usage: {
            promptTokens: usage?.input_tokens ?? 0,
            completionTokens: usage?.output_tokens ?? 0,
            totalTokens: (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0),
          },
        };
      }
    } catch (e) {
      if (e instanceof AiRuntimeError) throw e;
      // fallback abaixo
    }

    try {
      const completion = await client.chat.completions.create({
        model,
        messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature: input.temperature ?? 0.7,
      });
      recordAiSuccess();
      const content = completion.choices[0]?.message?.content?.trim() ?? "";
      return {
        provider: this.id,
        model: completion.model ?? model,
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
        },
      };
    } catch (e) {
      recordAiFailure();
      throw e;
    }
  }

  async *streamResponse(input: AiGenerateInput): AsyncIterable<AiStreamChunk> {
    this.assertConfigured();
    const client = getOpenAIClient();
    const model = input.model || AI_CONFIG.model;
    const stream = await client.chat.completions.create({
      model,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: input.maxTokens ?? AI_CONFIG.maxOutputTokens,
      temperature: input.temperature ?? 0.7,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) yield { delta };
    }
    yield { delta: "", done: true };
  }

  async embed(input: AiEmbedInput): Promise<AiEmbedResult> {
    this.assertConfigured();
    return createEmbeddings(input.texts, input.model);
  }

  async moderate(input: AiModerateInput): Promise<AiModerateResult> {
    this.assertConfigured();
    const result = await moderateContent(input.text);
    return {
      allowed: result.allowed && result.decision !== "BLOCK",
      categories: result.categories,
      reason: result.reason,
    };
  }

  async listModels(): Promise<AiModelInfo[]> {
    return Object.values(AI_MODEL_REGISTRY)
      .filter((m) => m.provider === "openai")
      .map((m) => ({
        id: m.id,
        provider: m.provider,
        name: m.label,
        version: m.version,
        contextWindow: m.contextWindow,
        streaming: m.streaming,
        vision: m.vision,
        functionCalling: m.functionCalling,
        status: m.enabled ? "ACTIVE" : "INACTIVE",
      }));
  }

  async healthCheck(): Promise<AiHealthCheckResult> {
    if (!AI_CONFIG.isConfigured) {
      return { ok: false, provider: this.id, message: "OPENAI_API_KEY ausente ou IA pausada." };
    }
    const started = Date.now();
    try {
      const client = getOpenAIClient();
      await client.models.list();
      return { ok: true, provider: this.id, latencyMs: Date.now() - started };
    } catch {
      return { ok: false, provider: this.id, message: "Falha ao contatar OpenAI.", latencyMs: Date.now() - started };
    }
  }
}

function extractResponsesText(response: unknown): string {
  const r = response as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const parts: string[] = [];
  for (const item of r.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.type === "output_text" && c.text) parts.push(c.text);
      else if (c.text) parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}
