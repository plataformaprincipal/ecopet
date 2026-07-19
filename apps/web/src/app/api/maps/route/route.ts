import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { computeRoute } from "@/lib/google-maps/routes";
import { GoogleMapsApiError } from "@/lib/google-maps/errors";

export const dynamic = "force-dynamic";

const latLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const bodySchema = z.object({
  origin: latLng,
  destination: latLng,
  mode: z.enum(["driving", "walking", "bicycling", "transit"]).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`maps-route:${user!.id}`, 15, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de rotas.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError("Origem/destino inválidos.");

  try {
    const route = await computeRoute({
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      mode: parsed.data.mode,
      userId: user!.id,
    });
    return apiSuccess(route);
  } catch (err) {
    if (err instanceof GoogleMapsApiError) {
      return apiFailure(err.code, err.message, 400);
    }
    return apiFailure("ROUTE_FAILED", "Falha ao calcular rota.", 500);
  }
}
