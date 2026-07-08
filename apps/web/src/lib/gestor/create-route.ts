import { apiSuccess } from "@/lib/api-response";
import { requireGestorAdmin } from "@/lib/gestor/gestor-permissions";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";

type HandlerFn = (filters: ReturnType<typeof parseGestorFilters>) => Promise<unknown>;

export function createGestorGetHandler(handler: HandlerFn) {
  return async function GET(request: Request) {
    const { error } = await requireGestorAdmin(request);
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
