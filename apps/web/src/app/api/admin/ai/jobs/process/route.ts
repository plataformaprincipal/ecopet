import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { processAiJobs } from "@/lib/ai/ai-jobs";

export async function POST() {
  const { user, error } = await requireAdmin();
  if (error || !user) return error!;
  const results = await processAiJobs(10);
  return apiSuccess({ processed: results.length, results });
}
