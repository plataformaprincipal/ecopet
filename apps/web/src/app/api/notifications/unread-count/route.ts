import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUnreadCount } from "@/lib/notifications/notification-service";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const count = await getUnreadCount(user!.id);
  return apiSuccess({ count });
}
