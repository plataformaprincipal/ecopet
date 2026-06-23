import type { NotificationType } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { listNotifications } from "@/lib/notifications/notification-service";

export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const readParam = url.searchParams.get("read");
  const typeParam = url.searchParams.get("type");

  const data = await listNotifications({
    userId: user!.id,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? "20"),
    read: readParam === "read" || readParam === "unread" ? readParam : undefined,
    type: typeParam ? (typeParam as NotificationType) : undefined,
  });

  return apiSuccess(data);
}
