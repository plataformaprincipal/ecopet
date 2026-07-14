import { AiProviderNotConfiguredError } from "@/lib/ai/errors";
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
import { AI_CONFIG } from "@/lib/ai/ai-config";

/** Contrato único — nenhuma tela importa OpenAI/Anthropic/Google diretamente. */
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  generateResponse(input: AiGenerateInput): Promise<AiGenerateResult>;
  streamResponse(input: AiGenerateInput): AsyncIterable<AiStreamChunk>;
  embed(input: AiEmbedInput): Promise<AiEmbedResult>;
  moderate(input: AiModerateInput): Promise<AiModerateResult>;
  listModels(): Promise<AiModelInfo[]>;
  healthCheck(): Promise<AiHealthCheckResult>;
}

class UnconfiguredAIProvider implements AIProvider {
  readonly id = "unconfigured";
  readonly name = "Unconfigured";

  private fail(): never {
    throw new AiProviderNotConfiguredError();
  }

  async generateResponse(_input: AiGenerateInput): Promise<AiGenerateResult> {
    this.fail();
  }

  async *streamResponse(_input: AiGenerateInput): AsyncIterable<AiStreamChunk> {
    this.fail();
  }

  async embed(_input: AiEmbedInput): Promise<AiEmbedResult> {
    this.fail();
  }

  async moderate(_input: AiModerateInput): Promise<AiModerateResult> {
    this.fail();
  }

  async listModels(): Promise<AiModelInfo[]> {
    this.fail();
  }

  async healthCheck(): Promise<AiHealthCheckResult> {
    return {
      ok: false,
      provider: this.id,
      message: "AI Provider not configured.",
    };
  }
}

let activeProvider: AIProvider | null = null;

/** Registra implementação real (ex.: OpenAIProvider) quando a chave estiver disponível. */
export function registerAIProvider(provider: AIProvider) {
  activeProvider = provider;
}

export function getAIProvider(): AIProvider {
  return activeProvider ?? new UnconfiguredAIProvider();
}

export function isAIProviderConfigured(): boolean {
  return activeProvider !== null;
}

/** Compatibilidade com código legado — delega para AIProvider.generateResponse */
export async function createAiCompletion(input: {
  prompt: string;
  systemPrompt: string;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, string>;
}) {
  const provider = getAIProvider();
  const result = await provider.generateResponse({
    model: input.modelId,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.prompt },
    ],
    maxTokens: input.maxTokens,
    temperature: input.temperature,
    metadata: input.metadata,
  });
  return {
    provider: result.provider as "openai" | "anthropic" | "google",
    model: result.model,
    content: result.content,
    usage: result.usage,
  };
}

export function assertOpenAiConfigured(): void {
  if (!isAIProviderConfigured()) {
    throw new AiProviderNotConfiguredError();
  }
}

export const assertProviderConfigured = assertOpenAiConfigured;

export function getAiStatus() {
  const openaiConfigured = Boolean(AI_CONFIG.apiKey) && AI_CONFIG.globallyEnabled;
  if (openaiConfigured && activeProvider === null) {
    try {
      // Import síncrono evitado no path quente; bootstrap via side-effect de index.ts
      void import("@/lib/ai/openai-provider").then(({ OpenAIProvider }) => {
        if (activeProvider === null) registerAIProvider(new OpenAIProvider());
      });
    } catch {
      // ignore
    }
  }
  const configured = isAIProviderConfigured() || openaiConfigured;
  return {
    openai: { configured: openaiConfigured },
    anthropic: { configured: Boolean(process.env.ANTHROPIC_API_KEY) },
    google: { configured: Boolean(process.env.GEMINI_API_KEY) },
    ready: configured && openaiConfigured,
    errorCode: openaiConfigured ? null : "AI_NOT_CONFIGURED",
    message: openaiConfigured
      ? null
      : "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.",
  };
}

export function isProviderReady(): boolean {
  return isAIProviderConfigured();
}
