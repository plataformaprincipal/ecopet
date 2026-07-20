import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { getGtmBackendStatus } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "status", auditResource: "gtm-status" },
    async () => apiSuccess(await getGtmBackendStatus())
  );
}
