import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { markAllAsRead } from "@/lib/notifications/notification-service";

export async function PATCH() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const count = await markAllAsRead(user!.id);
  return apiSuccess({ count });
}
