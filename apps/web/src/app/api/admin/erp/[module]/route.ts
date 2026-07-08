import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getErpModule } from "@/lib/admin/erp/registry";
import { requireAdmin } from "@/lib/admin/require-admin";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { mutateAdminErpModule } from "@/lib/admin/erp/mutations";

type Ctx = { params: Promise<{ module: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { module } = await ctx.params;
  return createAdminGetHandler((filters) => getErpModule(module, filters))(request);
}

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireAdmin({ path: `/api/admin/erp/${(await ctx.params).module}` });
  if (error || !user) return error!;

  const { module } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const result = await mutateAdminErpModule(user.id, module, body);
  if (!result.ok) {
    const code = result.status === 503 ? "PROVIDER_NOT_CONFIGURED" : "VALIDATION";
    return apiFailure(code, result.message, result.status);
  }
  return apiSuccess(result.data);
}
