import "server-only";
import { prisma } from "@/lib/prisma";
import { getOwnedExecution } from "./execution-service";
import { getAuthorizedPetContext } from "./pet-context";
import { runFollowUpMessage } from "./openai-gateway";
import { getProductDefBySku } from "./catalog";
import { getCapabilityRuntime } from "./capability-runtime";
import { getSpecialistProtocol } from "./specialist-protocols";
import { AiCommerceError } from "./errors";

function compactJson(value: unknown, max = 8000): string {
  try {
    const text = JSON.stringify(value);
    return text.length > max ? text.slice(0, max) : text;
  } catch {
    return "";
  }
}

async function findFollowUpConversation(userId: string, executionId: string) {
  const rows = await prisma.aIConversation.findMany({
    where: { userId, module: "ai-commerce-followup", deletedAt: null },
    include: { messages: { orderBy: { createdAt: "asc" as const }, take: 50 } },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
  return rows.find((row) => {
    const meta = row.metadata as { executionId?: string } | null;
    return meta?.executionId === executionId;
  }) ?? null;
}

export async function listFollowUp(params: { userId: string; executionId: string }) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  const conversation = await findFollowUpConversation(params.userId, execution.id);
  return {
    conversationId: conversation?.id ?? null,
    messages: (conversation?.messages ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}

export async function sendFollowUp(params: {
  userId: string;
  executionId: string;
  message: string;
  locale?: string;
}) {
  const text = params.message.trim().slice(0, 2000);
  if (text.length < 2) throw new AiCommerceError("VALIDATION", "Escreva uma pergunta sobre esta análise.", 400);
  const execution = await getOwnedExecution(params.userId, params.executionId);
  if (execution.status !== "COMPLETED") {
    throw new AiCommerceError("REPORT_NOT_READY", "Conclua a análise antes de conversar sobre o resultado.", 409);
  }
  const def = getProductDefBySku(execution.entitlement.sku);
  const runtime = def ? getCapabilityRuntime(def.sku) : undefined;
  const petContext = await getAuthorizedPetContext(params.userId, execution.petId);

  let conversationId = (await findFollowUpConversation(params.userId, execution.id))?.id ?? null;
  if (!conversationId) {
    const created = await prisma.aIConversation.create({
      data: {
        userId: params.userId,
        petId: execution.petId,
        module: "ai-commerce-followup",
        locale: params.locale ?? "pt-BR",
        title: runtime?.chatTitle ?? def?.name ?? "EccoPet AI",
        metadata: { executionId: execution.id, capabilityId: execution.capabilityId, sku: execution.entitlement.sku },
      },
    });
    conversationId = created.id;
  }

  await prisma.aIMessage.create({
    data: { conversationId, role: "user", content: text },
  });

  const protocol = getSpecialistProtocol(execution.entitlement.sku);
  const systemExtra = `
capabilityId: ${execution.capabilityId}
executionId: ${execution.id}
specialist: ${protocol?.specialistTitle ?? runtime?.specialistTitle ?? "Dr. Ecco"}
Você está conversando SOBRE ESTA execução. Use input, output, evidências e documentos desta análise.
Não recomece outra especialidade.
petContext: ${compactJson(petContext.petAIContext, 2500)}
originalInput: ${compactJson(execution.inputSnapshot, 2500)}
structuredResult: ${compactJson(execution.structuredOutput, 5000)}
`;

  const reply = await runFollowUpMessage({
    capabilityId: execution.capabilityId,
    locale: params.locale,
    systemExtra,
    userMessage: text,
  });

  const assistant = await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content: reply.text,
      model: reply.model,
      tokensInput: reply.inputTokens,
      tokensOutput: reply.outputTokens,
      totalTokens: reply.inputTokens + reply.outputTokens,
    },
  });

  return {
    conversationId,
    message: { id: assistant.id, role: "assistant", content: assistant.content, createdAt: assistant.createdAt },
  };
}
