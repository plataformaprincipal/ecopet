import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { ensureAiCommerceProducts } from "@/lib/ai-commerce/product-service";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { isAiCommerceEnabled, areAiCommercePricesConfirmed } from "@/lib/ai-commerce/flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  await ensureAiCommerceProducts();
  const products = await prisma.aIProduct.findMany({
    include: { prices: { where: { active: true }, orderBy: { version: "desc" }, take: 1 } },
    orderBy: { sortOrder: "asc" },
  });
  const skus = products.map((p) => p.sku);
  const [orders, executions] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["sku"],
      where: { itemType: "DIGITAL_AI", sku: { in: skus } },
      _count: { id: true },
      _sum: { grossAmount: true },
    }),
    prisma.aIExecution.groupBy({
      by: ["capabilityId"],
      _count: { id: true },
      _sum: { estimatedCostUsd: true },
    }),
  ]);
  return apiSuccess({
    flags: { commerceEnabled: isAiCommerceEnabled(), pricesConfirmed: areAiCommercePricesConfirmed() },
    products: products.map((p) => {
      const def = getProductDefBySku(p.sku);
      const sales = orders.find((o) => o.sku === p.sku);
      const cap = executions.find((e) => e.capabilityId === p.capabilityId);
      const revenue = Number(sales?._sum.grossAmount ?? 0);
      const cost = Number(cap?._sum.estimatedCostUsd ?? 0);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        status: p.status,
        usageLimit: p.usageLimit,
        sortOrder: p.sortOrder,
        badge: p.badge,
        capabilityId: p.capabilityId,
        pricesConfirmedAt: p.pricesConfirmedAt,
        priceInCents: p.prices[0]?.priceInCents ?? 0,
        priceSource: p.prices[0]?.source ?? "ADMIN_DEFAULT_PENDING_COMMERCIAL",
        sales: sales?._count.id ?? 0,
        executions: cap?._count.id ?? 0,
        revenue,
        aiCostUsd: cost,
        marginApprox: revenue - cost * 5.5,
        href: def?.href,
      };
    }),
  });
}
