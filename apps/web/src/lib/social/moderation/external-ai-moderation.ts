import type { ModerationProvider, ModerationDecision } from "./moderation-provider.types";

/** Stub para futura integração com IA de moderação — não ativo sem credenciais. */
export const externalAiModerationProvider: ModerationProvider = {
  name: "external_ai",
  async analyzeContent(): Promise<ModerationDecision> {
    if (!process.env.SOCIAL_AI_MODERATION_API_KEY) {
      return { allowed: true, flags: [], provider: "external_ai_disabled" };
    }
    // Futura etapa: chamar API externa
    return { allowed: true, flags: [], provider: "external_ai" };
  },
};
