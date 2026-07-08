import { AiProviderNotConfiguredError } from "@/lib/ai/errors";

/** Infraestrutura de embeddings — integração com provedor pendente. */
export async function createEmbedding(_input: { text: string }) {
  throw new AiProviderNotConfiguredError();
}

export function isEmbeddingsConfigured(): boolean {
  return false;
}
