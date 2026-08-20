import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CATALOG_COUNTS, officialActiveVersion, OFFICIAL_CATALOG } from "@/lib/pricing/catalog";
import { resolveActivePricingVersion, PricingError } from "@/lib/pricing/service";
import { OFFICIAL_PRICING_VERSION } from "@/lib/pricing/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/pricing" });
  if (error) return error;

  let versions: Awaited<ReturnType<typeof prisma.pricingVersion.findMany>> = [];
  let exceptions = 0;
  let promotions = 0;
  try {
    versions = await prisma.pricingVersion.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    exceptions = await prisma.pricingContractOverride.count({
      where: { validTo: { gte: new Date() } },
    });
    promotions = await prisma.pricingPromotion.count({
      where: { status: "ACTIVE" },
    });
  } catch {
    versions = [];
  }

  const active = versions.find((v) => v.status === "ACTIVE") ?? null;
  const scheduled = versions.find((v) => v.status === "SCHEDULED") ?? null;
  const lastChange = versions[0] ?? null;
  const memory = officialActiveVersion();
  let resolved;
  try {
    resolved = await resolveActivePricingVersion();
  } catch (e) {
    if (e instanceof PricingError) {
      return apiFailure(e.code, e.message, 503);
    }
    throw e;
  }

  const marginAlerts = OFFICIAL_CATALOG.filter((item) => {
    if (item.eccopetRevenueRefCents && item.costReferenceCents != null) {
      return item.costReferenceCents > item.eccopetRevenueRefCents;
    }
    return false;
  }).map((item) => ({ sku: item.sku, name: item.name, reason: "Custo de referência acima da receita EccoPet" }));

  return apiSuccess({
    activeVersion: active
      ? {
          id: active.id,
          version: active.version,
          country: active.country,
          currency: active.currency,
          status: active.status,
          validFrom: active.validFrom,
          updatedAt: active.updatedAt,
        }
      : {
          id: null,
          version: resolved.version,
          country: resolved.country,
          currency: resolved.currency,
          status: resolved.status,
          validFrom: memory.validFrom,
          updatedAt: null,
          memoryFallback: true,
        },
    nextVersion: scheduled
      ? { id: scheduled.id, version: scheduled.version, validFrom: scheduled.validFrom }
      : null,
    lastChange: lastChange ? { version: lastChange.version, updatedAt: lastChange.updatedAt, status: lastChange.status } : null,
    country: "BR",
    currency: "BRL",
    catalogCounts: CATALOG_COUNTS,
    exceptions,
    promotions,
    marginAlerts,
    officialVersion: OFFICIAL_PRICING_VERSION,
  });
}
