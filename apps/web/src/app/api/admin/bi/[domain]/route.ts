import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireBiAccess, getBiDomainReport, isBiDomain } from "@/lib/admin/bi";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ domain: string }> };

/** GET /api/admin/bi/:domain — Centro de Inteligência por domínio. */
export async function GET(request: Request, ctx: Ctx) {
  const { user, error } = await requireBiAccess();
  if (error) return error;

  if (!checkRateLimit(`bi-hub:${user!.id}`, 60, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de consultas BI.", 429);
  }

  const { domain } = await ctx.params;
  if (!isBiDomain(domain) && domain !== "executive") {
    return apiFailure("NOT_FOUND", "Domínio BI inválido.", 404);
  }

  const url = new URL(request.url);
  const data = await getBiDomainReport({
    domain: domain === "executive" ? "executive" : domain,
    period: url.searchParams.get("period"),
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    city: url.searchParams.get("city"),
    state: url.searchParams.get("state"),
    device: url.searchParams.get("device"),
  });

  try {
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "VIEW",
        module: "admin-bi",
        resource: `bi-${domain}`,
        status: "success",
        metadata: {
          domain,
          period: data.period ?? null,
          kpiCount: data.kpis?.length ?? 0,
        },
      },
    });
  } catch {
    /* best-effort */
  }

  return apiSuccess(data);
}
