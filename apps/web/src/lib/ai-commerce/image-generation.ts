import "server-only";
import { getOwnedExecution } from "./execution-service";
import { getProductDefBySku } from "./catalog";
import { getCapabilityRuntime } from "./capability-runtime";
import { generateAiImage } from "@/lib/ai/modules/services/generate-image";
import { AiCommerceError } from "./errors";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PROMPTS: Record<string, string> = {
  AI_ECCODENTAL:
    "Educational illustrated guide for safely brushing a pet's teeth, EccoPet branded, friendly health-tech style, clearly labeled 'conteúdo visual gerado por IA', not a clinical photo, not diagnostic.",
  AI_ECCONUTRI:
    "Educational visual routine of pet meal times, bowls and water, EccoPet branded infographic, labeled 'conteúdo visual gerado por IA', not diagnostic.",
  AI_ECCOBEHAVIOR:
    "Educational visual map of environmental enrichment for a pet at home, toys, rest areas and play, EccoPet branded, labeled 'conteúdo visual gerado por IA', not diagnostic.",
};

export async function generateEducationalImage(params: {
  userId: string;
  role: string;
  executionId: string;
}) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  const def = getProductDefBySku(execution.entitlement.sku);
  const runtime = def ? getCapabilityRuntime(def.sku) : undefined;
  if (!runtime?.supportsImageOutput) {
    throw new AiCommerceError("VALIDATION", "Esta ferramenta não gera imagens clínicas. A geração visual é só educativa.", 400);
  }
  const prompt = PROMPTS[def?.sku ?? ""] ?? PROMPTS.AI_ECCONUTRI!;
  const image = await generateAiImage({ userId: params.userId, role: params.role, prompt });
  const output = (execution.structuredOutput as Record<string, unknown> | null) ?? {};
  const generated = Array.isArray(output.generatedImages) ? output.generatedImages : [];
  const next = {
    ...output,
    generatedImages: [...generated, { url: image.url, label: "Conteúdo visual gerado por IA", educational: true }],
  };
  await prisma.aIExecution.update({
    where: { id: execution.id },
    data: { structuredOutput: next as Prisma.InputJsonValue },
  });
  return { url: image.url, label: "Conteúdo visual gerado por IA" };
}
