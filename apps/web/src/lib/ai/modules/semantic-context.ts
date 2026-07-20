/**
 * Abstração RAG / busca semântica — preparada.
 * Desabilitada por padrão no assistente (evita embeddings em todo chat).
 * Quando enabled=true, usa semanticSearch existente.
 */
import "server-only";

import { semanticSearch } from "@/lib/ai/ai-embeddings";
import { truncateToTokenBudget } from "./token-manager";

export type SemanticHit = {
  id: string;
  score: number;
  excerpt: string;
};

export async function buildSemanticContextStub(input: {
  query: string;
  enabled?: boolean;
  limit?: number;
  locale?: string;
}): Promise<{ enabled: boolean; hits: SemanticHit[]; block: string }> {
  if (!input.enabled) {
    return { enabled: false, hits: [], block: "" };
  }

  try {
    const results = await semanticSearch(input.query, {
      limit: input.limit ?? 3,
      locale: input.locale,
    });
    const hits: SemanticHit[] = (results ?? []).slice(0, input.limit ?? 3).map((r) => ({
      id: r.documentId,
      score: r.score,
      excerpt: `${r.title}: ${r.content}`.slice(0, 280),
    }));

    if (!hits.length) {
      return { enabled: true, hits: [], block: "" };
    }

    const block = truncateToTokenBudget(
      [
        "## Conhecimento interno (RAG preparado)",
        ...hits.map((h, idx) => `${idx + 1}. (score=${h.score.toFixed(3)}) ${h.excerpt}`),
      ].join("\n"),
      400
    );

    return { enabled: true, hits, block };
  } catch {
    return { enabled: true, hits: [], block: "" };
  }
}
