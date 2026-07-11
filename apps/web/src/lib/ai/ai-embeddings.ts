import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { AiRuntimeError, AI_RUNTIME_ERROR_CODES } from "@/lib/ai/ai-errors";

const CHUNK_SIZE = 800;

export function chunkText(content: string, size = CHUNK_SIZE): string[] {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += size) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function createEmbeddings(texts: string[], model?: string): Promise<{
  vectors: number[][];
  model: string;
  dimensions: number;
}> {
  if (!AI_CONFIG.isConfigured) {
    throw new AiRuntimeError(AI_RUNTIME_ERROR_CODES.KEY_MISSING, "IA não configurada.", 503);
  }
  const client = getOpenAIClient();
  const embedModel = model ?? AI_CONFIG.embeddingModel;
  const response = await client.embeddings.create({
    model: embedModel,
    input: texts,
  });
  const vectors = response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
  return {
    vectors,
    model: embedModel,
    dimensions: vectors[0]?.length ?? 0,
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function ingestKnowledgeDocument(input: {
  title: string;
  sourceType: string;
  sourceId?: string;
  locale?: string;
  content: string;
}) {
  const hash = contentHash(input.content);
  const doc = await prisma.aIKnowledgeDocument.upsert({
    where: {
      sourceType_sourceId_locale: {
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? "global",
        locale: input.locale ?? "pt-BR",
      },
    },
    create: {
      title: input.title,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? "global",
      locale: input.locale ?? "pt-BR",
      contentHash: hash,
      status: "ACTIVE",
    },
    update: {
      title: input.title,
      contentHash: hash,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  await prisma.aIEmbedding.deleteMany({ where: { documentId: doc.id } });
  const chunks = chunkText(input.content);
  if (chunks.length === 0) return { documentId: doc.id, chunks: 0 };

  const { vectors, model } = await createEmbeddings(chunks);
  for (let i = 0; i < chunks.length; i++) {
    await prisma.aIEmbedding.create({
      data: {
        documentId: doc.id,
        chunkIndex: i,
        content: chunks[i]!,
        embedding: vectors[i]!,
        metadata: { model },
      },
    });
  }
  return { documentId: doc.id, chunks: chunks.length };
}

export async function semanticSearch(query: string, opts?: { limit?: number; locale?: string }) {
  const limit = opts?.limit ?? 8;
  const { vectors } = await createEmbeddings([query]);
  const queryVec = vectors[0]!;
  const docs = await prisma.aIKnowledgeDocument.findMany({
    where: {
      status: "ACTIVE",
      ...(opts?.locale ? { locale: opts.locale } : {}),
    },
    include: { embeddings: true },
    take: 200,
  });

  const scored: { documentId: string; title: string; content: string; score: number; sourceType: string }[] = [];
  for (const doc of docs) {
    for (const emb of doc.embeddings) {
      const vec = Array.isArray(emb.embedding) ? (emb.embedding as number[]) : [];
      const score = cosineSimilarity(queryVec, vec);
      scored.push({
        documentId: doc.id,
        title: doc.title,
        content: emb.content,
        score,
        sourceType: doc.sourceType,
      });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Compat com stub antigo */
export async function createEmbedding(input: { text: string }) {
  const result = await createEmbeddings([input.text]);
  return {
    vector: result.vectors[0]!,
    model: result.model,
    dimensions: result.dimensions,
  };
}

export function isEmbeddingsConfigured(): boolean {
  return AI_CONFIG.isConfigured;
}
