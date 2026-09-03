import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OFFICIAL_CATALOG } from "@/lib/pricing/catalog";
import { invalidatePricingCache } from "@/lib/pricing/service";
import type { PricingSuite } from "@/lib/pricing/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/pricing/catalog" });
  if (error) return error;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const suite = url.searchParams.get("suite") as PricingSuite | null;
  const sku = url.searchParams.get("sku");
  const status = url.searchParams.get("status");

  let rows = OFFICIAL_CATALOG;
  try {
    const dbRows = await prisma.pricingCatalogItem.findMany({
      where: {
        ...(suite ? { suite } : {}),
        ...(sku ? { sku } : {}),
        ...(status
          ? {
              commercialAvailability: status as
                | "PURCHASABLE"
                | "CATALOG_ONLY"
                | "FEATURE_FLAGGED"
                | "PARTNER_REQUIRED"
                | "DISABLED"
                | "PRICE_PENDING",
            }
          : {}),
        ...(q
          ? {
              OR: [
                { sku: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { sku: "asc" },
      take: 400,
    });
    if (dbRows.length) {
      return apiSuccess({ items: dbRows, source: "database" });
    }
  } catch {
    /* fallback memória */
  }

  if (suite) rows = rows.filter((r) => r.suite === suite);
  if (sku) rows = rows.filter((r) => r.sku === sku);
  if (status) rows = rows.filter((r) => r.commercialAvailability === status);
  if (q) rows = rows.filter((r) => r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  return apiSuccess({ items: rows, source: "catalog" });
}

const patchSchema = z.object({
  sku: z.string().min(3),
  versionId: z.string().optional(),
  commercialAvailability: z
    .enum(["PURCHASABLE", "CATALOG_ONLY", "FEATURE_FLAGGED", "PARTNER_REQUIRED", "DISABLED", "PRICE_PENDING"])
    .optional(),
  billingEnabled: z.boolean().optional(),
  reason: z.string().min(3).max(240),
});

export async function PATCH(req: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/pricing/catalog" });
  if (error) return error;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFailure("VALIDATION", "Payload inválido.", 400);

  const version = parsed.data.versionId
    ? await prisma.pricingVersion.findUnique({ where: { id: parsed.data.versionId } })
    : await prisma.pricingVersion.findFirst({ where: { status: "ACTIVE", country: "BR" } });
  if (!version) return apiFailure("NOT_FOUND", "Versão não encontrada.", 404);

  const item = await prisma.pricingCatalogItem.findUnique({
    where: { versionId_sku: { versionId: version.id, sku: parsed.data.sku } },
  });
  if (!item) return apiFailure("NOT_FOUND", "SKU não encontrado nesta versão.", 404);

  if (version.status === "ACTIVE") {
    await prisma.pricingAuditEvent.create({
      data: {
        versionId: version.id,
        actorId: user!.id,
        action: "CATALOG_CHANGE_REQUESTED",
        entity: "PricingCatalogItem",
        entityId: item.id,
        reason: parsed.data.reason,
        beforeJson: {
          commercialAvailability: item.commercialAvailability,
          billingEnabled: item.billingEnabled,
        },
        afterJson: {
          commercialAvailability: parsed.data.commercialAvailability ?? item.commercialAvailability,
          billingEnabled: parsed.data.billingEnabled ?? item.billingEnabled,
        },
      },
    });
    return apiFailure(
      "MAKER_CHECKER",
      "Versão ACTIVE não é editada in-place. Pedido registrado para nova versão / publicação. Preços oficiais do PFO não mudam por este endpoint.",
      409
    );
  }

  const updated = await prisma.pricingCatalogItem.update({
    where: { id: item.id },
    data: {
      ...(parsed.data.commercialAvailability ? { commercialAvailability: parsed.data.commercialAvailability } : {}),
      ...(parsed.data.billingEnabled != null ? { billingEnabled: parsed.data.billingEnabled } : {}),
    },
  });
  await prisma.pricingAuditEvent.create({
    data: {
      versionId: version.id,
      actorId: user!.id,
      action: "CATALOG_PATCH",
      entity: "PricingCatalogItem",
      entityId: item.id,
      reason: parsed.data.reason,
      beforeJson: { commercialAvailability: item.commercialAvailability, billingEnabled: item.billingEnabled },
      afterJson: { commercialAvailability: updated.commercialAvailability, billingEnabled: updated.billingEnabled },
    },
  });
  invalidatePricingCache();
  return apiSuccess({ item: updated });
}

