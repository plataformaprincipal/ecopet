import { apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { isMercadoPagoCheckoutAvailable } from "@/lib/mercado-pago/config";
import { resolveUploadProvider } from "@/lib/upload/service";
import { isAiCommerceEnabled } from "@/lib/ai-commerce/flags";
import { AI_COMMERCE_SKU_LIST } from "@/lib/ai-commerce/flags";
import { getCatalogBySku } from "@/lib/pricing/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "ok" | "error" = "ok";
  let migration: "ok" | "error" = "error";
  let productsActive = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'AISubscription'
      ) as exists
    `;
    migration = tables[0]?.exists ? "ok" : "error";
    productsActive = await prisma.aIProduct.count({ where: { status: "ACTIVE" } });
  } catch {
    database = "error";
  }

  const pricingLoaded = AI_COMMERCE_SKU_LIST.every((sku) => Boolean(getCatalogBySku(sku)));
  const webhookConfigured = Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim());

  return apiSuccess({
    database,
    migration,
    commerceEnabled: isAiCommerceEnabled(),
    openai: AI_CONFIG.isConfigured ? "configured" : "missing",
    mercadoPago: isMercadoPagoCheckoutAvailable() ? "configured" : "missing",
    webhook: webhookConfigured ? "configured" : "missing",
    storage: resolveUploadProvider() ? "configured" : "missing",
    pricingLoaded,
    productsActive,
    productsExpected: AI_COMMERCE_SKU_LIST.length,
  });
}
