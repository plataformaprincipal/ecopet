import { z } from "zod";
import { NextResponse } from "next/server";
import { apiFailure } from "@/lib/api-response";
import { requireGestorAdmin } from "@/lib/gestor/gestor-permissions";
import { parseGestorFilters, GestorFilterError } from "@/lib/gestor/gestor-filters";
import { exportGestorReport } from "@/lib/gestor/gestor-export-service";
import type { GestorReportType } from "@/lib/gestor/gestor.types";

const exportSchema = z.object({
  type: z.enum([
    "users",
    "partners",
    "ongs",
    "products",
    "services",
    "orders",
    "appointments",
    "social",
    "moderation",
    "support",
    "integrations",
    "audit",
  ]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(500),
});

export async function POST(request: Request) {
  const { user, error } = await requireGestorAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  try {
    const filters = parseGestorFilters(
      new URLSearchParams(
        Object.entries(parsed.data)
          .filter(([k]) => k !== "type")
          .map(([k, v]) => [k, String(v)])
      )
    );
    const result = await exportGestorReport({
      type: parsed.data.type as GestorReportType,
      filters,
      adminId: user!.id,
    });

    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Export-Rows": String(result.rowCount),
        "X-Export-Truncated": String(result.truncated),
      },
    });
  } catch (e) {
    if (e instanceof GestorFilterError) {
      return apiFailure("VALIDATION", e.message, 400);
    }
    console.error("[gestor:export]", e);
    return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
  }
}
