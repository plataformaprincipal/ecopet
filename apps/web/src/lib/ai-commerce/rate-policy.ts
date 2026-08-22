import { AI_COMMERCE_SKUS, type AiCommerceSku, canonicalAiCommerceSku } from "./flags";

export type AiToolCostClass = "low" | "medium" | "high";

const HIGH: AiCommerceSku[] = [
  AI_COMMERCE_SKUS.VISION,
  AI_COMMERCE_SKUS.DENTAL,
  AI_COMMERCE_SKUS.EXAMS,
];

const MEDIUM: AiCommerceSku[] = [
  AI_COMMERCE_SKUS.NUTRI,
  AI_COMMERCE_SKUS.PESO,
  AI_COMMERCE_SKUS.CHECKUP,
  AI_COMMERCE_SKUS.REPORT,
  AI_COMMERCE_SKUS.HEALTH_PROFILE,
];

/** Janela de 1 hora. */
export const AI_TOOL_RATE_WINDOW_MS = 60 * 60 * 1000;

export function aiToolCostClass(sku: string): AiToolCostClass {
  const canonical = canonicalAiCommerceSku(sku);
  if ((HIGH as string[]).includes(canonical)) return "high";
  if ((MEDIUM as string[]).includes(canonical)) return "medium";
  return "low";
}

export function aiToolHourlyLimit(sku: string): number {
  const cls = aiToolCostClass(sku);
  if (cls === "high") return 4;
  if (cls === "medium") return 8;
  return 12;
}

export const AI_TOOL_GLOBAL_HOURLY_LIMIT = 30;
