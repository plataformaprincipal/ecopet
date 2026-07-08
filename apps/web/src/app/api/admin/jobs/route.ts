import { requireAdmin } from "@/lib/auth/guards";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { getAdminJobsModule } from "@/lib/platform/integration-automation-service";
import { processPendingJobs } from "@/lib/jobs/job-runner";

export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: "/api/admin/jobs" });
  if (error) return error;
  try {
    const filters = parseGestorFilters(new URL(request.url).searchParams);
    return apiSuccess(await getAdminJobsModule(filters));
  } catch (e) {
    return handleGestorRouteError(e);
  }
}

export async function POST() {
  const { error } = await requireAdmin({ path: "/api/admin/jobs" });
  if (error) return error;
  try {
    await processPendingJobs(25);
    return apiSuccess({ processed: true });
  } catch (e) {
    return handleGestorRouteError(e);
  }
}
