import OpenAI from "openai";
import { AI_CONFIG } from "@/lib/ai/ai-config";

let client: OpenAI | null = null;

/**
 * Cliente OpenAI único (singleton). Nunca instanciar por requisição.
 * A chave permanece apenas no servidor.
 */
export function getOpenAIClient(): OpenAI {
  if (!AI_CONFIG.apiKey) {
    throw new Error("OPENAI_API_KEY ausente.");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
      timeout: AI_CONFIG.requestTimeoutMs,
    });
  }
  return client;
}

export function resetOpenAIClientForTests() {
  client = null;
}

/** @deprecated Prefer getOpenAIClient(); mantido para o contrato solicitado. */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const instance = getOpenAIClient();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
