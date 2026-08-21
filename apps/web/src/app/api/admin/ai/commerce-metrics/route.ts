import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AI_COMMERCE_SKU_LIST } from "@/lib/ai-commerce/flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [items, executions, failed] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        itemType: "DIGITAL_AI",
        sku: { in: [...AI_COMMERCE_SKU_LIST] },
        order: { createdAt: { gte: since } },
      },
      select: { sku: true, grossAmount: true, order: { select: { status: true } } },
    }),
    prisma.aIExecution.findMany({
      where: { createdAt: { gte: since } },
      select: { estimatedCostUsd: true, status: true, createdAt: true, entitlement: { select: { sku: true } } },
    }),
    prisma.aIExecution.count({ where: { createdAt: { gte: since }, status: "FAILED" } }),
  ]);
  const paid = items.filter((i) => i.order.status === "PAID" || i.order.status === "COMPLETED");
  const revenue = paid.reduce((s, i) => s + i.grossAmount, 0);
  const cost = executions.reduce((s, e) => s + Number(e.estimatedCostUsd ?? 0), 0);
  const bySku: Record<string, number> = {};
  for (const i of paid) bySku[i.sku ?? ""] = (bySku[i.sku ?? ""] ?? 0) + i.grossAmount;
  return apiSuccess({
    revenue,
    orders: paid.length,
    avgTicket: paid.length ? revenue / paid.length : 0,
    executions: executions.length,
    openaiCostUsd: cost,
    estimatedMargin: revenue - cost * 5.5,
    failureRate: executions.length ? failed / executions.length : 0,
    revenueBySku: bySku,
  });
}
