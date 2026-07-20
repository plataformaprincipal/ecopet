import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Auditoria administrativa GTM (AuditLog module admin-analytics / gtm-*). */
export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "audit", limit: 20, auditResource: "gtm-audit" },
    async () => {
      const url = new URL(request.url);
      const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
      const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
      const where = {
        OR: [
          { resource: { startsWith: "gtm-" } },
          { resource: "gtm-governance" },
        ],
      };
      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            action: true,
            resource: true,
            status: true,
            createdAt: true,
            userId: true,
            metadata: true,
          },
        }),
      ]);
      return apiSuccess({
        total,
        page,
        pageSize,
        items: items.map((i) => ({
          ...i,
          userId: i.userId ? `${i.userId.slice(0, 6)}…` : null,
          createdAt: i.createdAt.toISOString(),
        })),
      });
    }
  );
}
