import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { softDeleteNotification } from "@/lib/notifications/notification-service";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const ok = await softDeleteNotification(id, user!.id);
  if (!ok) return apiFailure("NOT_FOUND", "Notificação não encontrada.", 404);
  return apiSuccess({ deleted: true });
}
