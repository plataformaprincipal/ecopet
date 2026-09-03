import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runStructuredCapability } from "@/lib/ai-commerce/openai-gateway";
import { CatalogCommerceError } from "@/lib/commerce-catalog/checkout";
import { pfoAiModule } from "./modules";

export async function runPfoAiModule(params: {
  userId: string;
  sku: string;
  input: Record<string, unknown>;
}) {
  const mod = pfoAiModule(params.sku);
  if (!mod) throw new CatalogCommerceError("SKU_UNKNOWN", "Módulo de IA PFO não encontrado.", 404);
  if (mod.professionalAct) {
    throw new CatalogCommerceError("PARTNER_REQUIRED", mod.blockedReason ?? "Exige profissional habilitado.", 409);
  }

  const entitlement = await prisma.catalogEntitlement.findFirst({
    where: { userId: params.userId, sku: params.sku, status: { in: ["AVAILABLE", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!entitlement) {
    throw new CatalogCommerceError("ENTITLEMENT_REQUIRED", "Contrate o módulo antes de usar.", 402);
  }
  if (entitlement.usageCount >= entitlement.usageLimit) {
    throw new CatalogCommerceError("USAGE_LIMIT", "Limite de utilizações deste módulo atingido.", 409);
  }

  const result = await runStructuredCapability({
    capabilityId: mod.capabilityId,
    promptVersion: "pfo-ai-v1",
    userPayload: params.input,
    context: {},
  });

  const prev = (entitlement.metadata ?? {}) as Record<string, unknown>;
  const history = Array.isArray(prev.history) ? prev.history : [];
  const entry = {
    at: new Date().toISOString(),
    capabilityId: mod.capabilityId,
    summary: typeof (result.output as { summary?: string })?.summary === "string"
      ? (result.output as { summary: string }).summary
      : "Resultado assistivo gerado.",
    notProfessionalDocument: true,
    model: result.model,
  };

  const updated = await prisma.catalogEntitlement.update({
    where: { id: entitlement.id },
    data: {
      usageCount: { increment: 1 },
      status: entitlement.usageCount + 1 >= entitlement.usageLimit ? "CONSUMED" : entitlement.status,
      metadata: {
        ...prev,
        lastRun: entry,
        history: [...history, entry].slice(-30),
      } as Prisma.InputJsonValue,
    },
  });

  return { entitlement: updated, result: result.output, disclaimer: "IA não emite laudo, diagnóstico, prescrição ou atestado definitivo." };
}
