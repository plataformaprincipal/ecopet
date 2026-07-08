import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { listUserMemorySessions } from "@/lib/ai/memory";
import { listAiLogs } from "@/lib/ai/logger";

export async function GET(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const view = url.searchParams.get("view") ?? "sessions";

  if (view === "logs") {
    const logs = await listAiLogs({ userId: user.id, limit });
    return apiSuccess({ logs });
  }

  const sessions = await listUserMemorySessions(user.id, limit);
  return apiSuccess({ sessions });
}
