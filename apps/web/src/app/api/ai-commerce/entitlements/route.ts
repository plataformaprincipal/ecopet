import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { listUserEntitlements } from "@/lib/ai-commerce/entitlement-service";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { remainingUsage } from "@/lib/ai-commerce/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const rows = await listUserEntitlements(user!.id);
  return apiSuccess({
    items: rows.map((e) => {
      const def = getProductDefBySku(e.sku);
      const remaining = remainingUsage({
        usageLimit: e.usageLimit,
        usageCount: e.usageCount,
        status: e.status,
      });
      return {
        id: e.id,
        sku: e.sku,
        name: def?.name ?? e.product?.name ?? e.sku,
        slug: def?.slug ?? e.product?.slug,
        pet: e.pet,
        status: e.status,
        usageLimit: e.usageLimit,
        usageCount: e.usageCount,
        remaining,
        purchasedAt: e.purchasedAt,
        orderId: e.orderId,
        href: remaining > 0 && def ? `/eccopet/${def.slug}` : def?.href,
        latestExecution: e.executions[0]
          ? { id: e.executions[0].id, status: e.executions[0].status, href: def?.workspaceHref(e.executions[0].id) }
          : null,
      };
    }),
  });
}
