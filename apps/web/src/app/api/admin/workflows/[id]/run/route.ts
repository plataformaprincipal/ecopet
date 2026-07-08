import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { writeAuditLog } from "@/lib/audit-log";
import { runWorkflowManually } from "@/lib/workflows/workflow-engine";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  const { user, error } = await requireAdmin({ path: "/api/admin/workflows" });
  if (error) return error;
  const { id } = await context.params;
  try {
    const instance = await runWorkflowManually(id, user!.id, { manual: true });
    await writeAuditLog({
      actorId: user!.id,
      action: "CREATE",
      module: "platform.workflows",
      resource: "WorkflowInstance",
      resourceId: instance.id,
      observation: "Execução manual",
    });
    return apiSuccess(instance);
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
