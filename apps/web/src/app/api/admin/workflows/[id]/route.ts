import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  lifecycleStatus: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "FAILED"]).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { error } = await requireAdmin({ path: "/api/admin/workflows" });
  if (error) return error;
  const { id } = await context.params;
  try {
    const wf = await prisma.workflowDefinition.findUnique({
      where: { id },
      include: { instances: { orderBy: { startedAt: "desc" }, take: 20, include: { logs: true } } },
    });
    if (!wf) return apiFailure("NOT_FOUND", "Workflow não encontrado.", 404);
    return apiSuccess(wf);
  } catch (e) {
    return handleGestorRouteError(e);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const { user, error } = await requireAdmin({ path: "/api/admin/workflows" });
  if (error) return error;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return apiFailure("VALIDATION", "Inválido", 400);
  try {
    const wf = await prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.lifecycleStatus ? { lifecycleStatus: parsed.data.lifecycleStatus } : {}),
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      },
    });
    await writeAuditLog({
      actorId: user!.id,
      action: "UPDATE",
      module: "platform.workflows",
      resource: "WorkflowDefinition",
      resourceId: id,
    });
    return apiSuccess(wf);
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
