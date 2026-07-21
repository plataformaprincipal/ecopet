import { apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Liveness — uptime Better Stack / load balancer. Sem dependências. */
export async function GET() {
  return apiSuccess({
    status: "ok",
    check: "live",
    ts: new Date().toISOString(),
  });
}
