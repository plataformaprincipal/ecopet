import { apiFailure } from "@/lib/api-response";
import {
  requireBiAccess,
  getBiDomainReport,
  buildBiExportPayload,
  resolveBiDomain,
  type BiExportFormat,
} from "@/lib/admin/bi";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FORMATS: BiExportFormat[] = ["csv", "excel", "json", "pdf"];

/** GET /api/admin/bi/export?domain=&format=&period= */
export async function GET(request: Request) {
  const { user, error } = await requireBiAccess();
  if (error) return error;

  if (!checkRateLimit(`bi-export:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de exportações BI.", 429);
  }

  const url = new URL(request.url);
  const domain = resolveBiDomain(url.searchParams.get("domain") ?? "executive");
  const formatRaw = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const format = (FORMATS.includes(formatRaw as BiExportFormat)
    ? formatRaw
    : "csv") as BiExportFormat;

  const data = await getBiDomainReport({
    domain,
    period: url.searchParams.get("period"),
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
  });

  const payload = buildBiExportPayload(data, format);

  try {
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: "EXPORT",
        module: "admin-bi",
        resource: `bi-export-${domain}`,
        status: "success",
        metadata: { format, domain },
      },
    });
  } catch {
    /* best-effort */
  }

  return new Response(payload.body, {
    status: 200,
    headers: {
      "Content-Type": payload.contentType,
      "Content-Disposition": `attachment; filename="${payload.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
