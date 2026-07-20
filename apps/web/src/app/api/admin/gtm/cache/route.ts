import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { gtmGovCacheClear } from "@/lib/admin/gtm-governance/cache";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  return withGtmAdminRoute(
    request,
    {
      rateKey: "cache",
      limit: 10,
      auditResource: "gtm-cache",
      auditAction: "DELETE",
    },
    async () => {
      gtmGovCacheClear();
      return apiSuccess({ cleared: true });
    }
  );
}
