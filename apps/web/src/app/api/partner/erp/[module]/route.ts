import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireApprovedPartner } from "@/lib/auth/require-auth";
import { getPartnerErpModule } from "@/lib/partner/erp/partner-erp-service";
import type { PartnerErpModuleId } from "@/lib/partner/erp/types";
import { PARTNER_ERP_MODULES } from "@/lib/partner/erp/types";
import { assertPartnerErpPermission } from "@/lib/partner/erp/access";
import { auditPartnerErp } from "@/lib/partner/erp/store";
import { mutatePartnerErpModule } from "@/lib/partner/erp/mutations";

const ALLOWED = new Set(Object.keys(PARTNER_ERP_MODULES));

export async function GET(_req: Request, { params }: { params: Promise<{ module: string }> }) {
  const { user, error } = await requireApprovedPartner();
  if (error) return error;

  const { module } = await params;
  if (!ALLOWED.has(module)) {
    return apiFailure("NOT_FOUND", "Módulo ERP não encontrado.", 404);
  }

  const { allowed } = await assertPartnerErpPermission(user!.id, user!.id, module, "view");
  if (!allowed) {
    return apiFailure("FORBIDDEN", "Sem permissão para visualizar este módulo.", 403);
  }

  await auditPartnerErp({
    actorId: user!.id,
    partnerId: user!.id,
    module,
    resource: "module",
    action: "VIEW",
    observation: `Visualização do módulo ${module}`,
  });

  const data = await getPartnerErpModule(prisma, user!.id, module as PartnerErpModuleId);
  return apiSuccess(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  const { user, error } = await requireApprovedPartner();
  if (error) return error;

  const { module } = await params;
  if (!ALLOWED.has(module)) {
    return apiFailure("NOT_FOUND", "Módulo ERP não encontrado.", 404);
  }

  const body = await request.json().catch(() => ({}));
  const result = await mutatePartnerErpModule(user!.id, user!.id, module as PartnerErpModuleId, body);
  if (!result.ok) {
    return apiFailure(result.status === 403 ? "FORBIDDEN" : "VALIDATION", result.message, result.status);
  }
  return apiSuccess(result.data);
}
