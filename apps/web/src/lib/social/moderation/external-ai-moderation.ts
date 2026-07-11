import type { ModerationProvider, ModerationDecision } from "./moderation-provider.types";
import { AI_CONFIG } from "@/lib/ai/ai-config";

/** Moderação social via camada central OpenAI (sem expor chave). */
export const externalAiModerationProvider: ModerationProvider = {
  name: "external_ai",
  async analyzeContent(text: string): Promise<ModerationDecision> {
    if (!AI_CONFIG.isConfigured && !process.env.SOCIAL_AI_MODERATION_API_KEY) {
      return { allowed: true, flags: [], provider: "external_ai_disabled" };
    }
    if (!text?.trim()) {
      return { allowed: true, flags: [], provider: "external_ai" };
    }
    try {
      const { moderateContent } = await import("@/lib/ai/ai-moderation");
      const result = await moderateContent(text);
      return {
        allowed: result.decision !== "BLOCK",
        flags: result.categories,
        provider: "openai_moderation",
      };
    } catch {
      return { allowed: true, flags: ["moderation_unavailable"], provider: "external_ai_error" };
    }
  },
};
