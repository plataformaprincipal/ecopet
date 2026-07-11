import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { moderateInput as regexModerate, moderateOutput as regexModerateOutput } from "@/lib/ai/moderation";

export type SafetyDecision = "ALLOW" | "REVIEW" | "BLOCK";

export type AiModerationResult = {
  decision: SafetyDecision;
  allowed: boolean;
  categories: string[];
  reason?: string;
};

const CRITICAL_CATEGORIES = new Set([
  "violence",
  "violence/graphic",
  "hate",
  "hate/threatening",
  "sexual/minors",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
]);

/**
 * Moderação em camadas: regex local + OpenAI Moderation API.
 * Assistiva — casos ambíguos vão para REVIEW.
 */
export async function moderateContent(text: string): Promise<AiModerationResult> {
  const local = await regexModerate(text);
  if (!local.allowed) {
    return {
      decision: "BLOCK",
      allowed: false,
      categories: local.categories,
      reason: local.reason,
    };
  }

  if (!AI_CONFIG.isConfigured) {
    return { decision: "ALLOW", allowed: true, categories: [] };
  }

  try {
    const client = getOpenAIClient();
    const result = await client.moderations.create({
      model: AI_CONFIG.moderationModel,
      input: text,
    });
    const item = result.results[0];
    if (!item) return { decision: "ALLOW", allowed: true, categories: [] };

    const flagged = Object.entries(item.categories ?? {})
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);

    if (!item.flagged) {
      return { decision: "ALLOW", allowed: true, categories: [] };
    }

    const critical = flagged.some((c) => CRITICAL_CATEGORIES.has(c));
    if (critical) {
      return {
        decision: "BLOCK",
        allowed: false,
        categories: flagged,
        reason: "Conteúdo bloqueado pelas políticas de segurança.",
      };
    }

    return {
      decision: "REVIEW",
      allowed: true,
      categories: flagged,
      reason: "Conteúdo sinalizado para revisão humana.",
    };
  } catch {
    // Falha de moderação externa → REVIEW (não libera cegamente conteúdo crítico)
    return {
      decision: "REVIEW",
      allowed: true,
      categories: ["moderation_unavailable"],
      reason: "Moderação externa indisponível; revisão humana recomendada.",
    };
  }
}

export async function moderateAiOutput(text: string): Promise<AiModerationResult> {
  const local = await regexModerateOutput(text);
  if (!local.allowed) {
    return { decision: "BLOCK", allowed: false, categories: local.categories, reason: local.reason };
  }
  return moderateContent(text);
}

export { moderateInput, moderateOutput } from "@/lib/ai/moderation";
