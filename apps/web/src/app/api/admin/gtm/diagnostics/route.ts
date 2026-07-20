import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { runGtmBackendDiagnostics } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "diagnostics", limit: 15, auditResource: "gtm-diagnostics" },
    async () => apiSuccess(await runGtmBackendDiagnostics())
  );
}
