import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const sku = url.searchParams.get("sku");
  const q = url.searchParams.get("q");
  const rows = await prisma.aIExecution.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(sku ? { entitlement: { sku } } : {}),
      ...(q
        ? {
            OR: [{ id: { contains: q } }, { userId: { contains: q } }, { failureCode: { contains: q } }],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      entitlement: { select: { sku: true } },
      pet: { select: { name: true } },
    },
  });
  return apiSuccess({
    items: rows.map((r) => ({
      id: r.id,
      sku: r.entitlement.sku,
      status: r.status,
      model: r.model,
      durationMs:
        r.startedAt && r.completedAt ? r.completedAt.getTime() - r.startedAt.getTime() : null,
      estimatedCostUsd: r.estimatedCostUsd,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      failureCode: r.failureCode,
      petName: r.pet.name,
      createdAt: r.createdAt,
    })),
  });
}
