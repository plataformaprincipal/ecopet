import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getChannelStatus,
  getOrCreatePreferences,
  updatePreferences,
} from "@/lib/notifications/notification-service";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const [preferences, channels] = await Promise.all([
    getOrCreatePreferences(user!.id),
    getChannelStatus(),
  ]);
  return apiSuccess({ preferences, channels });
}

export async function PUT(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const body = await req.json();
  const preferences = await updatePreferences(user!.id, body);
  const channels = await getChannelStatus();
  return apiSuccess({ preferences, channels });
}
