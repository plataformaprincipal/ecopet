import { createAdminGetHandler } from "@/lib/admin/create-admin-route";
import { getErpModule } from "@/lib/admin/erp/registry";

type Ctx = { params: Promise<{ module: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { module } = await ctx.params;
  return createAdminGetHandler((filters) => getErpModule(module, filters))(request);
}
