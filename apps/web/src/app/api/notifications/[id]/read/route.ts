import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { markAsRead } from "@/lib/notifications/notification-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const notification = await markAsRead(id, user!.id);
  if (!notification) return apiFailure("NOT_FOUND", "Notificação não encontrada.", 404);
  return apiSuccess({ notification });
}
