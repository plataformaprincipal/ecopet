import { withGtmAdminRoute, apiSuccess, apiFailure } from "@/lib/server/gtm/http";
import { getGtmOpsConfig, patchGtmOpsConfig } from "@/lib/server/gtm";
import type { GtmOpsConfigFlags } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "config-get", auditResource: "gtm-config" },
    async () => apiSuccess(await getGtmOpsConfig())
  );
}

export async function PATCH(request: Request) {
  return withGtmAdminRoute(
    request,
    {
      rateKey: "config-patch",
      limit: 10,
      auditResource: "gtm-config",
      auditAction: "UPDATE",
    },
    async ({ userId }) => {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return apiFailure("VALIDATION", "JSON inválido.", 400);
      }
      const raw = (body ?? {}) as GtmOpsConfigFlags;
      const patch: GtmOpsConfigFlags = {};
      if (typeof raw.collectionEnabled === "boolean")
        patch.collectionEnabled = raw.collectionEnabled;
      if (typeof raw.debugEnabled === "boolean") patch.debugEnabled = raw.debugEnabled;
      if (typeof raw.consentRequired === "boolean")
        patch.consentRequired = raw.consentRequired;
      if (raw.diagnosticLevel === "basic" || raw.diagnosticLevel === "full") {
        patch.diagnosticLevel = raw.diagnosticLevel;
      }
      if (typeof raw.allowProductionTest === "boolean") {
        patch.allowProductionTest = raw.allowProductionTest;
      }
      if (Object.keys(patch).length === 0) {
        return apiFailure("VALIDATION", "Nenhuma flag operacional válida.", 400);
      }
      try {
        const flags = await patchGtmOpsConfig(patch, userId);
        return apiSuccess({ flags });
      } catch (e) {
        return apiFailure(
          "VALIDATION",
          e instanceof Error ? e.message : "Falha ao atualizar config.",
          400
        );
      }
    }
  );
}
