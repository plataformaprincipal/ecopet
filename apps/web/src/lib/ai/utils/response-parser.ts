/**
 * Parser mínimo de respostas — sem armazenar conteúdo completo em logs.
 */

export function parseAiTextResponse(raw: unknown): {
  content: string;
  truncated: boolean;
  preview: string;
} {
  const content = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  const truncated = content.length > 2_000;
  const preview = content.slice(0, 120) + (content.length > 120 ? "…" : "");
  return { content, truncated, preview };
}

export function extractJsonBlock(text: string): unknown | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}
