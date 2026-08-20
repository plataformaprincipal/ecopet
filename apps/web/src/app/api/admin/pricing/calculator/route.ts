import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getCatalogBySku, officialActiveVersion } from "@/lib/pricing/catalog";
import { quotePricing, PricingError } from "@/lib/pricing/engine";
import { resolveActivePricingVersion } from "@/lib/pricing/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["PRODUCT", "SERVICE", "HEALTH", "SUBSCRIPTION", "AI", "ADS"]),
  baseAmount: z.number().finite(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  urgent: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/pricing/calculator" });
  if (error) return error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiFailure("VALIDATION", "Payload inválido.", 400);
  if (parsed.data.baseAmount < 0) return apiFailure("VALIDATION", "Valor negativo.", 400);

  try {
    const version = await resolveActivePricingVersion();
    const catalog = parsed.data.sku ? getCatalogBySku(parsed.data.sku) : null;
    const quote = quotePricing({
      kind: parsed.data.kind,
      sku: parsed.data.sku,
      baseAmountCents: Math.round(parsed.data.baseAmount * 100),
      quantity: parsed.data.quantity ?? 1,
      urgent: parsed.data.urgent,
      urgentEligible: catalog?.urgentEligible ?? parsed.data.urgent,
      version: version.status === "ACTIVE" ? version : { ...officialActiveVersion(), ...version, status: "ACTIVE" },
      catalogItem: catalog,
      partnerVerified: true,
      allowZero: catalog?.allowZero,
    });
    return apiSuccess({ quote, estimatesOnly: true });
  } catch (e) {
    if (e instanceof PricingError) return apiFailure(e.code, e.message, 400);
    return apiFailure("INTERNAL", "Falha no simulador.", 500);
  }
}
