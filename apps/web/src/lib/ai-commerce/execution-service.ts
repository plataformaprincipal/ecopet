import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  consumeEntitlement,
  reserveEntitlementForExecution,
  restoreEntitlement,
} from "./entitlement-service";
import { runStructuredCapability, type GatewayImage } from "./openai-gateway";
import { getProductDefBySku } from "./catalog";
import { AI_AUDIT, writeAiCommerceAudit } from "./audit";
import { AiCommerceError } from "./errors";
import { createInternalNotification } from "@/lib/notifications/internal";
import { getAuthorizedPetContext } from "./pet-context";

export async function startOrGetExecution(params: { userId: string; entitlementId: string }) {
  return prisma.$transaction(async (tx) => {
    const { entitlement, execution, reused } = await reserveEntitlementForExecution({
      userId: params.userId,
      entitlementId: params.entitlementId,
      tx,
    });
    if (!reused) {
      await writeAiCommerceAudit({
        tx,
        userId: params.userId,
        action: AI_AUDIT.EXECUTION_STARTED,
        sku: entitlement.sku,
        entitlementId: entitlement.id,
        executionId: execution.id,
        orderId: entitlement.orderId,
      });
    }
    return { entitlement, execution };
  });
}

export async function saveExecutionInput(params: {
  userId: string;
  executionId: string;
  input: Prisma.InputJsonValue;
}) {
  const execution = await prisma.aIExecution.findUnique({ where: { id: params.executionId } });
  if (!execution || execution.userId !== params.userId) {
    throw new AiCommerceError("EXECUTION_FORBIDDEN", "Execução não encontrada.", 403);
  }
  return prisma.aIExecution.update({
    where: { id: execution.id },
    data: { inputSnapshot: params.input, status: execution.status === "COMPLETED" ? execution.status : "DRAFT" },
  });
}

export async function runExecution(params: {
  userId: string;
  executionId: string;
  images?: GatewayImage[];
}) {
  const execution = await prisma.aIExecution.findUnique({
    where: { id: params.executionId },
    include: { entitlement: true },
  });
  if (!execution || execution.userId !== params.userId) {
    throw new AiCommerceError("EXECUTION_FORBIDDEN", "Execução não encontrada.", 403);
  }
  if (execution.status === "COMPLETED") return execution;
  await assertPetOwned(params.userId, execution.petId);

  await prisma.aIExecution.update({
    where: { id: execution.id },
    data: { status: "PROCESSING", startedAt: execution.startedAt ?? new Date() },
  });

  const def = getProductDefBySku(execution.entitlement.sku);
  const context = await getAuthorizedPetContext(params.userId, execution.petId);

  try {
    const assets = await prisma.aIUploadedAsset.findMany({
      where: { executionId: execution.id, userId: params.userId, status: "READY" },
    });
    const images: GatewayImage[] = [
      ...(params.images ?? []),
      ...assets
        .filter((a) => a.storageKey.startsWith("http"))
        .map((a) => ({ mimeType: a.mimeType, url: a.storageKey })),
    ];
    const result = await runStructuredCapability({
      capabilityId: execution.capabilityId,
      promptVersion: execution.promptVersion ?? def?.promptVersion ?? "v1",
      userPayload: execution.inputSnapshot,
      images,
      context,
    });
    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.aIExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          structuredOutput: result.output as Prisma.InputJsonValue,
          model: result.model,
          promptVersion: result.promptVersion,
          completedAt: new Date(),
          inputTokens: result.inputTokens,
          cachedInputTokens: result.cachedInputTokens,
          outputTokens: result.outputTokens,
          estimatedCostUsd: result.estimatedCostUsd,
        },
      });
      await consumeEntitlement({
        tx,
        entitlementId: execution.entitlementId,
        executionId: execution.id,
      });
      await writeAiCommerceAudit({
        tx,
        userId: params.userId,
        action: AI_AUDIT.EXECUTION_COMPLETED,
        sku: execution.entitlement.sku,
        executionId: execution.id,
        entitlementId: execution.entitlementId,
        metadata: { model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
      });
      return updated;
    });
    try {
      const { generateAiReport } = await import("./report-service");
      await generateAiReport({ userId: params.userId, executionId: completed.id });
      if (def?.hasWorkbook) {
        const { generateAiWorkbook } = await import("./workbook-service");
        await generateAiWorkbook({ userId: params.userId, executionId: completed.id });
      }
    } catch {
      /* relatório/planilha podem ser gerados depois */
    }
    const pet = await prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } });
    void createInternalNotification({
      userId: params.userId,
      title: "Avaliação pronta",
      body: pet?.name ? `A avaliação de ${pet.name} ficou pronta.` : "Sua avaliação ficou pronta.",
      type: "AI_EXECUTION_COMPLETED",
      actionUrl: def ? def.workspaceHref(execution.id) : "/minha-conta/ia",
      data: { executionId: execution.id },
    });
    return completed;
  } catch (e) {
    await prisma.$transaction(async (tx) => {
      await tx.aIExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: e instanceof AiCommerceError ? e.code : "AI_UNAVAILABLE",
          failureMessage: "Falha recuperável — utilização preservada.",
          retryCount: { increment: 1 },
        },
      });
      await restoreEntitlement({ tx, entitlementId: execution.entitlementId });
      await writeAiCommerceAudit({
        tx,
        userId: params.userId,
        action: AI_AUDIT.EXECUTION_FAILED,
        sku: execution.entitlement.sku,
        executionId: execution.id,
        entitlementId: execution.entitlementId,
        metadata: { code: e instanceof AiCommerceError ? e.code : "AI_UNAVAILABLE" },
      });
    });
    const pet = await prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } });
    void createInternalNotification({
      userId: params.userId,
      title: "Análise não concluída",
      body: "Não conseguimos concluir sua análise. Sua utilização continua disponível.",
      type: "AI_EXECUTION_FAILED",
      actionUrl: "/minha-conta/ia",
      data: { executionId: execution.id, petName: pet?.name },
    });
    throw e instanceof AiCommerceError
      ? e
      : new AiCommerceError("AI_UNAVAILABLE", "Não conseguimos concluir sua análise agora. Sua utilização não foi consumida.", 503);
  }
}

export async function getOwnedExecution(userId: string, executionId: string) {
  const execution = await prisma.aIExecution.findUnique({
    where: { id: executionId },
    include: {
      entitlement: true,
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      assets: true,
      pet: {
        select: { id: true, name: true, species: true, breed: true, birthDate: true, weight: true, photo: true, sex: true },
      },
    },
  });
  if (!execution || execution.userId !== userId) {
    throw new AiCommerceError("EXECUTION_FORBIDDEN", "Execução não encontrada.", 403);
  }
  return execution;
}
