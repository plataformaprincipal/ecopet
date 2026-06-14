import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { isOpenAiConfigured } from "@/lib/integrations/env-check";
import { writeIntegrationLog } from "@/lib/integrations/log";

export type AiProvider = "openai";

export type AiCompletionInput = {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  metadata?: Record<string, string>;
};

export type AiCompletionResult = {
  provider: AiProvider;
  model: string;
  content: string;
};

export function assertOpenAiConfigured(env = process.env): void {
  if (!isOpenAiConfigured(env)) {
    throw new IntegrationNotConfiguredError(
      INTEGRATION_ERROR_CODES.OPENAI_NOT_CONFIGURED,
      "OpenAI não configurado. Defina OPENAI_API_KEY."
    );
  }
}

/** Interface preparada — não gera resposta falsa sem chave */
export async function createAiCompletion(input: AiCompletionInput): Promise<AiCompletionResult> {
  assertOpenAiConfigured();

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  await writeIntegrationLog({
    integrationName: "openai",
    provider: "OpenAI",
    action: "completion",
    status: "PENDING",
    message: "Chave presente — implementação de chamada pendente (Etapa 9B).",
    metadata: { promptLength: input.prompt.length },
  });

  throw new IntegrationNotConfiguredError(
    INTEGRATION_ERROR_CODES.OPENAI_NOT_CONFIGURED,
    "Chamada OpenAI preparada mas não ativada nesta etapa."
  );
}

export function getAiStatus(env = process.env) {
  return {
    configured: isOpenAiConfigured(env),
    errorCode: isOpenAiConfigured(env) ? null : INTEGRATION_ERROR_CODES.OPENAI_NOT_CONFIGURED,
  };
}
