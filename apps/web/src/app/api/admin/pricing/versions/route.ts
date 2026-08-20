import { z } from "zod";
import { Prisma } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { officialActiveVersion } from "@/lib/pricing/catalog";
import { invalidatePricingCache } from "@/lib/pricing/service";
import { OFFICIAL_RULES } from "@/lib/pricing/official-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/pricing/versions" });
  if (error) return error;
  try {
    const versions = await prisma.pricingVersion.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return apiSuccess({ versions });
  } catch {
    return apiSuccess({ versions: [officialActiveVersion()], memoryFallback: true });
  }
}

const createSchema = z.object({
  version: z.string().min(3).max(64),
  country: z.string().length(2).default("BR"),
  duplicateFromId: z.string().optional(),
  validFrom: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/pricing/versions" });
  if (error) return error;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFailure("VALIDATION", "Payload inválido.", 400);

  const source = parsed.data.duplicateFromId
    ? await prisma.pricingVersion.findUnique({
        where: { id: parsed.data.duplicateFromId },
        include: { items: true, rules: true },
      })
    : null;

  const created = await prisma.pricingVersion.create({
    data: {
      version: parsed.data.version,
      country: parsed.data.country.toUpperCase(),
      currency: "BRL",
      status: "DRAFT",
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : new Date(),
      sourceDocument: source?.sourceDocument ?? "Planejamento Financeiro e Orçamentário",
      sourceSection: source?.sourceSection,
      rulesJson: source?.rulesJson ?? OFFICIAL_RULES,
      items: source
        ? {
            create: source.items.map((item) => ({
              sku: item.sku,
              name: item.name,
              suite: item.suite,
              kind: item.kind,
              pricingMode: item.pricingMode,
              commercialAvailability: item.commercialAvailability,
              revenueRecognition: item.revenueRecognition,
              amountCents: item.amountCents,
              annualAmountCents: item.annualAmountCents,
              setupAmountCents: item.setupAmountCents,
              referenceTicketCents: item.referenceTicketCents,
              referenceTutorCents: item.referenceTutorCents,
              providerBaseCents: item.providerBaseCents,
              rangeMinCents: item.rangeMinCents,
              rangeMaxCents: item.rangeMaxCents,
              nationalReferenceCents: item.nationalReferenceCents,
              costReferenceCents: item.costReferenceCents,
              eccopetRevenueRefCents: item.eccopetRevenueRefCents,
              unit: item.unit,
              billingCycle: item.billingCycle,
              urgentEligible: item.urgentEligible,
              complexProcedure: item.complexProcedure,
              allowZero: item.allowZero,
              capabilityId: item.capabilityId,
              portfolioSuiteId: item.portfolioSuiteId,
              mediaPassThrough: item.mediaPassThrough,
              sourceDocument: item.sourceDocument,
              sourceSection: item.sourceSection,
              sourceSku: item.sourceSku,
            })),
          }
        : undefined,
      rules: source
        ? {
            create: source.rules.map((rule) => ({
              code: rule.code,
              scope: rule.scope,
              priority: rule.priority,
              formulaJson: rule.formulaJson as Prisma.InputJsonValue,
              floorMarginBps: rule.floorMarginBps,
              effectiveFrom: rule.effectiveFrom,
              effectiveTo: rule.effectiveTo,
            })),
          }
        : undefined,
    },
  });

  await prisma.pricingAuditEvent.create({
    data: {
      versionId: created.id,
      actorId: user!.id,
      action: "CREATE_DRAFT",
      entity: "PricingVersion",
      entityId: created.id,
      afterJson: { version: created.version, duplicatedFrom: parsed.data.duplicateFromId ?? null },
    },
  });
  await writeAuditLog({
    actorId: user!.id,
    action: "CREATE",
    module: "pricing",
    resource: "PricingVersion",
    resourceId: created.id,
    entityAfter: { version: created.version, status: created.status },
  }).catch(() => undefined);

  return apiSuccess({ version: created }, 201);
}

const actionSchema = z.object({
  id: z.string(),
  action: z.enum(["activate", "schedule", "archive", "rollback"]),
  validFrom: z.string().optional(),
  reason: z.string().optional(),
});

export async function PATCH(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/pricing/versions" });
  if (error) return error;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFailure("VALIDATION", "Payload inválido.", 400);

  const current = await prisma.pricingVersion.findUnique({ where: { id: parsed.data.id } });
  if (!current) return apiFailure("NOT_FOUND", "Versão não encontrada.", 404);

  if (parsed.data.action === "activate" || parsed.data.action === "rollback") {
    await prisma.$transaction([
      prisma.pricingVersion.updateMany({
        where: { country: current.country, status: "ACTIVE", id: { not: current.id } },
        data: { status: "ARCHIVED" },
      }),
      prisma.pricingVersion.update({
        where: { id: current.id },
        data: {
          status: "ACTIVE",
          approvedBy: user!.id,
          approvedAt: new Date(),
          rollbackVersionId: parsed.data.action === "rollback" ? current.rollbackVersionId : undefined,
        },
      }),
    ]);
    invalidatePricingCache();
  } else if (parsed.data.action === "schedule") {
    if (current.status === "ACTIVE") {
      return apiFailure("CONFLICT", "Não altere silenciosamente uma versão ACTIVE. Duplique para nova versão.", 409);
    }
    await prisma.pricingVersion.update({
      where: { id: current.id },
      data: {
        status: "SCHEDULED",
        validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : current.validFrom,
      },
    });
  } else {
    if (current.status === "ACTIVE") {
      return apiFailure("CONFLICT", "Arquive somente após ativar outra versão.", 409);
    }
    await prisma.pricingVersion.update({
      where: { id: current.id },
      data: { status: "ARCHIVED" },
    });
  }

  await prisma.pricingAuditEvent.create({
    data: {
      versionId: current.id,
      actorId: user!.id,
      action: parsed.data.action.toUpperCase(),
      entity: "PricingVersion",
      entityId: current.id,
      reason: parsed.data.reason ?? null,
      beforeJson: { status: current.status },
    },
  });

  const updated = await prisma.pricingVersion.findUnique({ where: { id: current.id } });
  return apiSuccess({ version: updated });
}
