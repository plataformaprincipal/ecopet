import type { ModerationProvider, ModerationDecision } from "./moderation-provider.types";

/** Moderação padrão: manual via admin. Sem IA ativa. */
export const internalModerationProvider: ModerationProvider = {
  name: "internal",
  async analyzeContent(): Promise<ModerationDecision> {
    return { allowed: true, flags: [], provider: "internal" };
  },
};
