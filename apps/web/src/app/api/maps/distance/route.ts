import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { computeDistanceMatrix } from "@/lib/google-maps/routes";
import { haversineDistance } from "@/lib/google-maps/distance";
import { GoogleMapsApiError } from "@/lib/google-maps/errors";

export const dynamic = "force-dynamic";

const latLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const bodySchema = z.object({
  origin: latLng,
  destination: latLng,
  mode: z.enum(["driving", "walking", "bicycling", "transit", "haversine"]).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`maps-distance:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de distância.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError("Coordenadas inválidas.");

  const mode = parsed.data.mode ?? "haversine";

  if (mode === "haversine") {
    return apiSuccess(haversineDistance(parsed.data.origin, parsed.data.destination));
  }

  try {
    const result = await computeDistanceMatrix({
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      mode,
      userId: user!.id,
    });
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof GoogleMapsApiError) {
      return apiFailure(err.code, err.message, 400);
    }
    return apiFailure("DISTANCE_FAILED", "Falha ao calcular distância.", 500);
  }
}
