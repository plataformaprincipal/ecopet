import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";
import { getNgoErpModule } from "@/lib/ong/erp/ngo-erp-service";
import type { NgoErpModuleId } from "@/lib/ong/erp/types";
import { NGO_ERP_MODULES } from "@/lib/ong/erp/types";
import { assertNgoErpPermission } from "@/lib/ong/erp/access";
import { auditNgoErp } from "@/lib/ong/erp/store";
import { mutateNgoErpModule } from "@/lib/ong/erp/mutations";

const ALLOWED = new Set(Object.keys(NGO_ERP_MODULES));

export async function GET(_req: Request, { params }: { params: Promise<{ module: string }> }) {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;

  const { module } = await params;
  if (!ALLOWED.has(module)) {
    return apiFailure("NOT_FOUND", "Módulo ERP não encontrado.", 404);
  }

  const { allowed } = await assertNgoErpPermission(user!.id, user!.id, module, "view");
  if (!allowed) {
    return apiFailure("FORBIDDEN", "Sem permissão para visualizar este módulo.", 403);
  }

  await auditNgoErp({
    actorId: user!.id,
    ongId: user!.id,
    module,
    resource: "module",
    action: "VIEW",
    observation: `Visualização do módulo ${module}`,
  });

  const data = await getNgoErpModule(prisma, user!.id, module as NgoErpModuleId);
  return apiSuccess(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const { user, error } = await requireOngWithAccess(true);
  if (error) return error;

  const { module } = await params;
  if (!ALLOWED.has(module)) {
    return apiFailure("NOT_FOUND", "Módulo ERP não encontrado.", 404);
  }

  const body = await request.json().catch(() => ({}));
  const result = await mutateNgoErpModule(user!.id, user!.id, module as NgoErpModuleId, body);
  if (!result.ok) {
    const code =
      result.status === 403 ? "FORBIDDEN" : result.status === 503 ? "PROVIDER_NOT_CONFIGURED" : "VALIDATION";
    return apiFailure(code, result.message, result.status);
  }
  return apiSuccess(result.data);
}
