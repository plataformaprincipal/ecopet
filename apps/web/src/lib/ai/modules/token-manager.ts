/** Estimativa e janela de tokens para prompts/contexto. */

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  if (estimateTokens(text) <= maxTokens) return text;
  const maxChars = Math.max(64, maxTokens * 4);
  return `${text.slice(0, maxChars)}\n…[contexto truncado]`;
}

export function buildSlidingWindow<T extends { content: string }>(
  items: T[],
  maxMessages: number,
  maxTokens: number
): T[] {
  const window = items.slice(-maxMessages);
  let total = 0;
  const kept: T[] = [];
  for (let i = window.length - 1; i >= 0; i--) {
    const t = estimateTokens(window[i].content);
    if (total + t > maxTokens && kept.length > 0) break;
    total += t;
    kept.unshift(window[i]);
  }
  return kept;
}
