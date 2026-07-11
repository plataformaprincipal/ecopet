/**
 * Bootstrap: registra OpenAIProvider quando a chave estiver presente.
 * Importar cedo (via index.ts) — nunca no client bundle.
 */
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { registerAIProvider, isAIProviderConfigured } from "@/lib/ai/provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";

export function bootstrapOpenAIProvider(): boolean {
  if (isAIProviderConfigured()) return true;
  if (!AI_CONFIG.isConfigured) return false;
  registerAIProvider(new OpenAIProvider());
  return true;
}

bootstrapOpenAIProvider();
