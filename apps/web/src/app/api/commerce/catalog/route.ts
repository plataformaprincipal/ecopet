import { apiFailure, apiSuccess } from "@/lib/api-response";
import { listFamilyQuotes, quoteCatalogSku } from "@/lib/commerce-catalog/quote";
import { HEALTH_MARKETPLACE_GROUPS } from "@/lib/commerce-catalog/products";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sku = url.searchParams.get("sku");
  const family = url.searchParams.get("family");
  try {
    if (sku) {
      const row = await quoteCatalogSku(sku, {
        billingCycle: url.searchParams.get("cycle") === "year" ? "year" : "month",
        urgent: url.searchParams.get("urgent") === "1",
      });
      return apiSuccess({ item: row });
    }
    if (family) {
      const items = await listFamilyQuotes(family);
      return apiSuccess({ items, groups: family === "HEALTH_DIGITAL" || family === "TELEHEALTH" ? HEALTH_MARKETPLACE_GROUPS : [] });
    }
    const families = ["ONE", "PRO", "TELEHEALTH", "HEALTH_PLAN", "EXAMS", "PROTECT", "ENTERTAINMENT", "ADS", "AI_ADDON", "IOT", "API"];
    const items = [];
    for (const f of families) items.push(...(await listFamilyQuotes(f)));
    return apiSuccess({ items, groups: HEALTH_MARKETPLACE_GROUPS });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return apiFailure(err.code ?? "ERROR", err.message ?? "Falha ao cotar catálogo.", 400);
  }
}
