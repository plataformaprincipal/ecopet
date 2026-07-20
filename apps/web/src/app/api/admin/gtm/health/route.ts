import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { runGtmBackendHealth } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "health", limit: 20, auditResource: "gtm-health" },
    async () => {
      const url = new URL(request.url);
      const persist = url.searchParams.get("persist") === "1";
      return apiSuccess(await runGtmBackendHealth(persist));
    }
  );
}
