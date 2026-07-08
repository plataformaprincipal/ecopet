import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { writeAuditLog } from "@/lib/audit-log";
import { retryJob } from "@/lib/jobs/job-queue";
import { processJobById } from "@/lib/jobs/job-runner";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  const { user, error } = await requireAdmin({ path: "/api/admin/jobs" });
  if (error) return error;
  const { id } = await context.params;
  try {
    await retryJob(id);
    await processJobById(id);
    await writeAuditLog({
      actorId: user!.id,
      action: "UPDATE",
      module: "platform.jobs",
      resource: "JobQueue",
      resourceId: id,
      observation: "Retry manual",
    });
    return apiSuccess({ retried: true });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
