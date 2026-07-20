import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  exportGovernanceCsv,
  exportGovernanceExcel,
  exportGovernanceJson,
  exportGovernancePdfText,
  getGtmGovernanceReport,
  type GtmExportFormat,
} from "@/lib/admin/gtm-governance";
import { writeAnalyticsAudit } from "@/lib/analytics/server/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/gtm/export?format=json|csv|excel|pdf
 */
export async function GET(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/gtm/export" });
  if (error) return error;

  if (!checkRateLimit(`gtm-export:${user!.id}`, 10, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de exportações.", 429);
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "json") as GtmExportFormat;
  const report = await getGtmGovernanceReport({ skipCache: true });

  await writeAnalyticsAudit({
    userId: user!.id,
    action: "EXPORT",
    resource: "gtm-governance",
    metadata: { format },
  });

  if (format === "csv") {
    return new NextResponse(exportGovernanceCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="gtm-governance.csv"',
      },
    });
  }
  if (format === "excel") {
    return new NextResponse(exportGovernanceExcel(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="gtm-governance.xls.csv"',
      },
    });
  }
  if (format === "pdf") {
    return new NextResponse(exportGovernancePdfText(report), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="gtm-governance.txt"',
      },
    });
  }

  return new NextResponse(exportGovernanceJson(report), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gtm-governance.json"',
    },
  });
}
