import "server-only";
import { prisma } from "@/lib/prisma";
import { getOwnedExecution } from "./execution-service";
import { getProductDefBySku } from "./catalog";
import { buildXlsx, workbookFromOutput } from "./workbook";
import { AiCommerceError } from "./errors";

export async function generateAiWorkbook(params: { userId: string; executionId: string }) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  if (execution.status !== "COMPLETED" || !execution.structuredOutput) {
    throw new AiCommerceError("REPORT_NOT_READY", "O resultado ainda não está disponível.", 409);
  }
  const existing = await prisma.aIWorkbook.findFirst({ where: { executionId: execution.id } });
  if (existing) return existing;
  const def = getProductDefBySku(execution.entitlement.sku);
  const pet = await prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } });
  const bytes = buildXlsx(
    workbookFromOutput(execution.capabilityId, execution.structuredOutput as Record<string, unknown>, pet?.name ?? "")
  );
  return prisma.aIWorkbook.create({
    data: {
      executionId: execution.id,
      userId: params.userId,
      petId: execution.petId,
      type: def?.workbookTitle ?? "planilha",
      storageKey: `memory:${execution.id}`,
    },
  }).then(async (row) => {
    void bytes;
    return row;
  });
}

export async function getWorkbookBytes(params: { userId: string; executionId: string }) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  if (execution.status !== "COMPLETED" || !execution.structuredOutput) {
    throw new AiCommerceError("REPORT_NOT_READY", "A planilha ainda não está disponível.", 409);
  }
  const pet = await prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } });
  await generateAiWorkbook(params).catch(() => undefined);
  return buildXlsx(
    workbookFromOutput(execution.capabilityId, execution.structuredOutput as Record<string, unknown>, pet?.name ?? "")
  );
}
