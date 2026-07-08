import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  triggerEvent: z.string().min(1),
  actions: z.array(z.record(z.unknown())).min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/workflows" });
  if (error) return error;
  try {
    const filters = parseGestorFilters(new URL(request.url).searchParams);
    const [items, total] = await Promise.all([
      prisma.workflowDefinition.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { instances: { take: 1, orderBy: { startedAt: "desc" } } },
      }),
      prisma.workflowDefinition.count(),
    ]);
    return apiSuccess({ items, pagination: { page: filters.page, limit: filters.limit, total } });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/workflows" });
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  try {
    const wf = await prisma.workflowDefinition.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        triggerType: "event",
        triggerConfig: { eventType: parsed.data.triggerEvent },
        actions: parsed.data.actions as object,
        isActive: parsed.data.status !== "INACTIVE",
        lifecycleStatus: parsed.data.status ?? "ACTIVE",
        createdById: user!.id,
      },
    });
    await writeAuditLog({
      actorId: user!.id,
      action: "CREATE",
      module: "platform.workflows",
      resource: "WorkflowDefinition",
      resourceId: wf.id,
    });
    return apiSuccess(wf);
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
