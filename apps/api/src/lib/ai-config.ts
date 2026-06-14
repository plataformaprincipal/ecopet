/** Preparação para IA — implementação futura */
export const AI_ENABLED = process.env.AI_ENABLED === "true";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export function assertAiConfigured(): boolean {
  return AI_ENABLED && Boolean(OPENAI_API_KEY);
}
