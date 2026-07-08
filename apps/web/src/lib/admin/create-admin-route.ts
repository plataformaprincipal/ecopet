import { requireAdmin } from "@/lib/auth/guards";
import { parseGestorFilters } from "@/lib/gestor/gestor-filters";
import { handleGestorRouteError } from "@/lib/gestor/api-handler";
import { apiSuccess } from "@/lib/api-response";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
type HandlerFn = (filters: GestorFilters) => Promise<unknown>;

export function createAdminGetHandler(handler: HandlerFn) {
  return async function GET(request: Request) {
    const { error } = await requireAdmin({ path: new URL(request.url).pathname });
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

export function createAdminMutationHandler<TBody>(
  handler: (ctx: { userId: string; body: TBody; request: Request }) => Promise<unknown>
) {
  return async function mutationHandler(request: Request) {
    const { user, error } = await requireAdmin({ path: new URL(request.url).pathname });
    if (error) return error;
    const body = (await request.json().catch(() => ({}))) as TBody;
    try {
      const data = await handler({ userId: user!.id, body, request });
      return apiSuccess(data);
    } catch (e) {
      return handleGestorRouteError(e);
    }
  };
}
