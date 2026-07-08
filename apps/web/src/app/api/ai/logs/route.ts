import { apiSuccess } from "@/lib/api-response";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { getAiLogStats, listAiLogs } from "@/lib/ai/logger";
import { listTokenUsage } from "@/lib/ai/logs/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminView = url.searchParams.get("admin") === "true";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  if (adminView) {
    const { error } = await requireAdmin({ path: url.pathname });
    if (error) return error;

    const [logs, stats, costs] = await Promise.all([
      listAiLogs({ adminView: true, limit }),
      getAiLogStats(),
      listTokenUsage({ limit }),
    ]);

    return apiSuccess({ logs, stats, costs });
  }

  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const [logs, stats] = await Promise.all([
    listAiLogs({ userId: user.id, limit }),
    getAiLogStats(user.id),
  ]);

  return apiSuccess({ logs, stats });
}
