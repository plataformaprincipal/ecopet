import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OFFICIAL_CATALOG } from "@/lib/pricing/catalog";
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
        ...(status ? { commercialAvailability: status as "PURCHASABLE" | "CATALOG_ONLY" | "FEATURE_FLAGGED" | "PARTNER_REQUIRED" | "DISABLED" } : {}),
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
