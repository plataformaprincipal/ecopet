import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") as AuditAction | null;
  const actorId = searchParams.get("actorId") ?? undefined;
  const resourceId = searchParams.get("resourceId") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const moduleFilter = searchParams.get("module") ?? "admin.accounts";

  const where = {
    module: moduleFilter,
    ...(action ? { action } : {}),
    ...(actorId ? { userId: actorId } : {}),
    ...(resourceId ? { resourceId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return apiSuccess({
    logs: logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      action: log.action,
      module: log.module,
      resource: log.resource,
      resourceId: log.resourceId,
      observation: log.observation,
      entityBefore: log.entityBefore,
      entityAfter: log.entityAfter,
      metadata: log.metadata,
      actor: log.actor,
    })),
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}
