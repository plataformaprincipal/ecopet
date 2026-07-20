import { withGtmAdminRoute, apiSuccess } from "@/lib/server/gtm/http";
import { getGtmEventCatalog } from "@/lib/server/gtm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withGtmAdminRoute(
    request,
    { rateKey: "events", auditResource: "gtm-events" },
    async () => {
      const url = new URL(request.url);
      const transactional = url.searchParams.get("transactional");
      const instrumented = url.searchParams.get("instrumented");
      return apiSuccess(
        getGtmEventCatalog({
          module: url.searchParams.get("module") ?? undefined,
          q: url.searchParams.get("q") ?? undefined,
          page: Number(url.searchParams.get("page") ?? 1),
          pageSize: Number(url.searchParams.get("pageSize") ?? 25),
          transactional:
            transactional === "1" ? true : transactional === "0" ? false : undefined,
          instrumented:
            instrumented === "1" ? true : instrumented === "0" ? false : undefined,
        })
      );
    }
  );
}
