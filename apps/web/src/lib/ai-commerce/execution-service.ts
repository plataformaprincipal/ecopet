import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  consumeEntitlement,
  reserveEntitlementForExecution,
  restoreEntitlement,
  assertPetOwned,
} from "./entitlement-service";
import { runStructuredCapability, type GatewayFile, type GatewayImage } from "./openai-gateway";
import { getProductDefBySku } from "./catalog";
import { AI_AUDIT, writeAiCommerceAudit } from "./audit";
import { AiCommerceError } from "./errors";
import { createInternalNotification } from "@/lib/notifications/internal";
import { getAuthorizedPetContext } from "./pet-context";
import { detectRedFlags } from "./red-flags";
import { applySafetyLayer, postprocessSpecialistOutput } from "./postprocess";
import { AI_COMMERCE_LIMITS } from "./models";

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
  input: Record<string, unknown>;
}) {
  const execution = await prisma.aIExecution.findUnique({ where: { id: params.executionId } });
  if (!execution || execution.userId !== params.userId) {
    throw new AiCommerceError("EXECUTION_FORBIDDEN", "Execução não encontrada.", 403);
  }
  return prisma.aIExecution.update({
    where: { id: execution.id },
    data: {
      inputSnapshot: params.input as Prisma.InputJsonValue,
      status: execution.status === "COMPLETED" ? execution.status : "DRAFT",
    },
  });
}

export async function runExecution(params: {
  userId: string;
  executionId: string;
  images?: GatewayImage[];
  locale?: string;
}) {
  const execution = await prisma.aIExecution.findUnique({
    where: { id: params.executionId },
    include: { entitlement: true, pet: { select: { species: true } } },
  });
  if (!execution || execution.userId !== params.userId) {
    throw new AiCommerceError("EXECUTION_FORBIDDEN", "Execução não encontrada.", 403);
  }
  if (execution.status === "COMPLETED") return execution;
  if (execution.status === "PROCESSING" && execution.startedAt && Date.now() - execution.startedAt.getTime() < AI_COMMERCE_LIMITS.timeoutMs) {
    throw new AiCommerceError("IN_PROGRESS", "Esta análise já está em andamento.", 409);
  }
  await assertPetOwned(params.userId, execution.petId);

  await prisma.aIExecution.update({
    where: { id: execution.id },
    data: { status: "PROCESSING", startedAt: execution.startedAt ?? new Date() },
  });

  const def = getProductDefBySku(execution.entitlement.sku);
  const context = await getAuthorizedPetContext(params.userId, execution.petId);
  const started = Date.now();
  const input = (execution.inputSnapshot as Record<string, unknown> | null) ?? {};
  const preFlags = detectRedFlags(input);

  try {
    const assets = await prisma.aIUploadedAsset.findMany({
      where: { executionId: execution.id, userId: params.userId, status: "READY" },
    });
    const images: GatewayImage[] = [
      ...(params.images ?? []),
      ...assets
        .filter((a) => a.mimeType.startsWith("image/") && a.storageKey.startsWith("http"))
        .map((a) => ({ mimeType: a.mimeType, url: a.storageKey })),
    ];
    const files: GatewayFile[] = assets
      .filter((a) => a.mimeType === "application/pdf" && a.storageKey.startsWith("http"))
      .map((a) => ({ mimeType: a.mimeType, url: a.storageKey, fileName: "documento.pdf" }));

    const result = await runStructuredCapability({
      capabilityId: execution.capabilityId,
      promptVersion: execution.promptVersion ?? def?.promptVersion ?? "v1",
      userPayload: {
        ...input,
        redFlagsDetected: preFlags,
      },
      images,
      files,
      context,
      locale: params.locale,
    });

    const processed = applySafetyLayer(
      postprocessSpecialistOutput({
        sku: execution.entitlement.sku,
        capabilityId: execution.capabilityId,
        input,
        output: result.output,
        weightHistory: (context.weightHistory as Array<{ weight: number; recordedAt: string }> | undefined) ?? [],
        species: execution.pet?.species ?? null,
      })
    );

    const completed = await prisma.$transaction(async (tx) => {
      const updated = await tx.aIExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          structuredOutput: processed as Prisma.InputJsonValue,
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
        metadata: {
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: Date.now() - started,
          attachmentCount: assets.length,
          openaiResponseId: result.openaiResponseId ?? null,
          inputType: files.length ? "file" : images.length ? "image" : "text",
          success: true,
        },
      });
      return updated;
    });

    const artifactStatus: { pdf: string; xlsx: string } = { pdf: "SKIPPED", xlsx: "SKIPPED" };
    try {
      const { generateAiReport } = await import("./report-service");
      await generateAiReport({ userId: params.userId, executionId: completed.id });
      artifactStatus.pdf = "COMPLETED";
    } catch {
      artifactStatus.pdf = "FAILED";
    }
    if (def?.hasWorkbook) {
      try {
        const { generateAiWorkbook } = await import("./workbook-service");
        await generateAiWorkbook({ userId: params.userId, executionId: completed.id });
        artifactStatus.xlsx = "COMPLETED";
      } catch {
        artifactStatus.xlsx = "FAILED";
      }
    }
    processed.artifactStatus = artifactStatus;
    await prisma.aIExecution.update({
      where: { id: completed.id },
      data: { structuredOutput: processed as Prisma.InputJsonValue },
    }).catch(() => undefined);

    const pet = await prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } });
    void createInternalNotification({
      userId: params.userId,
      title: "Avaliação pronta",
      body: pet?.name ? `A avaliação de ${pet.name} ficou pronta.` : "Sua avaliação ficou pronta.",
      type: "AI_EXECUTION_COMPLETED",
      actionUrl: def ? def.workspaceHref(execution.id) : "/minha-conta/ia",
      data: { executionId: execution.id },
    });
    return { ...completed, structuredOutput: processed, status: "COMPLETED" as const };
  } catch (e) {
    await prisma.$transaction(async (tx) => {
      await tx.aIExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureCode: e instanceof AiCommerceError ? e.code : "AI_UNAVAILABLE",
          failureMessage: e instanceof AiCommerceError ? e.message : "Falha recuperável — utilização preservada.",
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
        metadata: {
          code: e instanceof AiCommerceError ? e.code : "AI_UNAVAILABLE",
          latencyMs: Date.now() - started,
          success: false,
        },
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
