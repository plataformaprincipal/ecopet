import { apiSuccess, apiFailure } from "@/lib/api-response";
import { getServiceAvailabilitySlots } from "@/lib/appointments/availability";

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { serviceId } = await context.params;
  const date = new URL(request.url).searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiFailure("VALIDATION", "Informe date no formato YYYY-MM-DD.", 400);
  }

  const result = await getServiceAvailabilitySlots(serviceId, date);
  if (!result) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);

  return apiSuccess(result);
}
