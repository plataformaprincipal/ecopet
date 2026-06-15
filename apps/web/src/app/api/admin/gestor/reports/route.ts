import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireGestorAdmin } from "@/lib/gestor/gestor-permissions";
import { parseGestorFilters, GestorFilterError } from "@/lib/gestor/gestor-filters";
import { getGestorReport, listGestorReportsMeta } from "@/lib/gestor/gestor-reports-service";
import type { GestorReportType } from "@/lib/gestor/gestor.types";

const typeSchema = z.enum([
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
]);

export async function GET(request: Request) {
  const { error } = await requireGestorAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type) {
    return apiSuccess(await listGestorReportsMeta());
  }

  const parsedType = typeSchema.safeParse(type);
  if (!parsedType.success) {
    return apiFailure("VALIDATION", "Tipo de relatório inválido.", 400);
  }

  try {
    const filters = parseGestorFilters(searchParams);
    const data = await getGestorReport(parsedType.data as GestorReportType, filters);
    return apiSuccess({ type: parsedType.data, ...data });
  } catch (e) {
    if (e instanceof GestorFilterError) {
      return apiFailure("VALIDATION", e.message, 400);
    }
    console.error("[gestor:reports]", e);
    return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
  }
}
