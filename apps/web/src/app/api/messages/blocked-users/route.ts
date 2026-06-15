import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listBlockedUsers } from "@/lib/messages/blocks";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const users = await listBlockedUsers(user!.id);
    return apiSuccess({ users });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
