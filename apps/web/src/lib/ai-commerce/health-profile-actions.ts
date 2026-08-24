import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getOwnedExecution } from "./execution-service";
import { assertPetOwned } from "./entitlement-service";
import { AiCommerceError } from "./errors";
import { getProductDefBySku } from "./catalog";

export async function addExecutionToHealthProfile(params: {
  userId: string;
  executionId: string;
  items: string[];
}) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  await assertPetOwned(params.userId, execution.petId);
  if (execution.status !== "COMPLETED") {
    throw new AiCommerceError("REPORT_NOT_READY", "Conclua a análise antes de adicionar ao perfil.", 409);
  }
  const items = params.items.map((i) => i.trim()).filter(Boolean).slice(0, 20);
  if (!items.length) throw new AiCommerceError("VALIDATION", "Selecione o que será adicionado.", 400);

  const def = getProductDefBySku(execution.entitlement.sku);
  const existing = await prisma.petHealthProfile.findUnique({ where: { petId: execution.petId } });
  const prev = (existing?.lastSummary as Record<string, unknown> | null) ?? {};
  const confirmed = Array.isArray(prev.confirmedItems) ? (prev.confirmedItems as unknown[]) : [];
  const entry = {
    executionId: execution.id,
    capabilityId: execution.capabilityId,
    module: def?.name ?? execution.capabilityId,
    items,
    provenance: "USER_REPORTED",
    addedAt: new Date().toISOString(),
    note: "Confirmado pelo tutor. Inferências da IA não entram como fato clínico automático.",
  };
  const next = {
    ...prev,
    confirmedItems: [...confirmed, entry],
  };

  if (existing) {
    await prisma.petHealthProfile.update({
      where: { petId: execution.petId },
      data: { lastSummary: next as Prisma.InputJsonValue },
    });
  } else {
    await prisma.petHealthProfile.create({
      data: {
        petId: execution.petId,
        userId: params.userId,
        lastSummary: next as Prisma.InputJsonValue,
      },
    });
  }
  return { added: items.length, provenance: "USER_REPORTED" as const };
}
