/**
 * Feature flags do EcoPet IA — rollback rápido via env.
 * Prefixo: AI_FLAG_* = "false" desliga; ausente/true liga (quando AI global on).
 */
import { AI_CONFIG } from "@/lib/ai/ai-config";

function flag(name: string, defaultOn = true): boolean {
  if (!AI_CONFIG.globallyEnabled) return false;
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return defaultOn;
}

export type AiFeatureFlag =
  | "assistant"
  | "streaming"
  | "tools"
  | "automations"
  | "smart_notifications"
  | "marketplace_ai"
  | "explore_ai"
  | "mypet_ai"
  | "partner_ai"
  | "ngo_ai"
  | "admin_ai"
  | "predictions"
  | "content_generation"
  | "finance_insights"
  | "moderation_assist"
  | "summaries"
  | "recommendations";

const ENV_MAP: Record<AiFeatureFlag, string> = {
  assistant: "AI_FLAG_ASSISTANT",
  streaming: "AI_FLAG_STREAMING",
  tools: "AI_FLAG_TOOLS",
  automations: "AI_FLAG_AUTOMATIONS",
  smart_notifications: "AI_FLAG_SMART_NOTIFICATIONS",
  marketplace_ai: "AI_FLAG_MARKETPLACE",
  explore_ai: "AI_FLAG_EXPLORE",
  mypet_ai: "AI_FLAG_MYPET",
  partner_ai: "AI_FLAG_PARTNER",
  ngo_ai: "AI_FLAG_NGO",
  admin_ai: "AI_FLAG_ADMIN",
  predictions: "AI_FLAG_PREDICTIONS",
  content_generation: "AI_FLAG_CONTENT_GEN",
  finance_insights: "AI_FLAG_FINANCE",
  moderation_assist: "AI_FLAG_MODERATION",
  summaries: "AI_FLAG_SUMMARIES",
  recommendations: "AI_FLAG_RECOMMENDATIONS",
};

export function isAiFlagEnabled(flagName: AiFeatureFlag): boolean {
  return flag(ENV_MAP[flagName], true);
}

export function assertAiFlag(flagName: AiFeatureFlag): void {
  if (!isAiFlagEnabled(flagName)) {
    const err = new Error(`Módulo IA desativado: ${flagName}`);
    (err as Error & { code?: string }).code = "AI_FLAG_DISABLED";
    throw err;
  }
}

export function listAiFeatureFlags(): Record<AiFeatureFlag, boolean> {
  const out = {} as Record<AiFeatureFlag, boolean>;
  for (const key of Object.keys(ENV_MAP) as AiFeatureFlag[]) {
    out[key] = isAiFlagEnabled(key);
  }
  return out;
}
