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
  const configured = isAIProviderConfigured();
  return {
    openai: { configured: false },
    anthropic: { configured: false },
    google: { configured: false },
    ready: configured,
    errorCode: configured ? null : "AI_PROVIDER_NOT_CONFIGURED",
    message: configured ? null : "AI Provider not configured.",
  };
}

export function isProviderReady(): boolean {
  return isAIProviderConfigured();
}
