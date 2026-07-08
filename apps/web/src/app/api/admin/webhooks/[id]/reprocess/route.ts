import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { writeAuditLog } from "@/lib/audit-log";
import { reprocessWebhook } from "@/lib/webhooks/webhook-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  const { user, error } = await requireAdmin({ path: "/api/admin/webhooks" });
  if (error) return error;
  const { id } = await context.params;
  try {
    const event = await reprocessWebhook(id);
    await writeAuditLog({
      actorId: user!.id,
      action: "SYNC",
      module: "platform.webhooks",
      resource: "WebhookEvent",
      resourceId: id,
      observation: "Reprocessamento manual",
    });
    return apiSuccess(event);
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") {
      return handleGestorRouteError(new Error("NOT_FOUND"));
    }
    return handleGestorRouteError(e);
  }
}
