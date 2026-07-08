import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import {
  buildClientReportSummary,
  reportToCsv,
  reportToPdfBytes,
  type ReportPeriod,
} from "@/lib/client/reports";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const [weekly, monthly, annual] = await Promise.all([
    buildClientReportSummary(prisma, user!.id, "weekly"),
    buildClientReportSummary(prisma, user!.id, "monthly"),
    buildClientReportSummary(prisma, user!.id, "annual"),
  ]);

  return apiSuccess({ reports: { weekly, monthly, annual } });
}

const exportSchema = z.object({
  period: z.enum(["weekly", "monthly", "annual"]),
  format: z.enum(["csv", "pdf"]),
});

export async function POST(request: Request) {
  const { user, error } = await requireClient();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  const summary = await buildClientReportSummary(prisma, user.id, parsed.data.period as ReportPeriod);
  const filename = `ecopet-relatorio-${parsed.data.period}`;

  if (parsed.data.format === "csv") {
    return new NextResponse(reportToCsv(summary), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const pdf = reportToPdfBytes(summary);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
