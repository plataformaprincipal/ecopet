import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";

type HandlerFn = (filters: GestorFilters) => Promise<unknown>;

export function createAdminGetHandler(handler: HandlerFn) {
  return async function GET(request: Request) {
    const { error } = await requireAdmin();
    if (error) return error;
    try {
      const filters = parseGestorFilters(new URL(request.url).searchParams);
      const data = await handler(filters);
      return apiSuccess(data);
    } catch (e) {
      return handleGestorRouteError(e);
    }
  };
}
