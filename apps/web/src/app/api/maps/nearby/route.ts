import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchNearby } from "@/lib/google-maps/nearby";
import { clampRadiusKm, parseLatLng } from "@/lib/google-maps/validation";
import type { NearbyEntityType } from "@/lib/google-maps/types";

export const dynamic = "force-dynamic";

/** Busca parceiros/ONGs próximos — haversine local (sem chamada Google por request). */
export async function GET(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`maps-nearby:${user!.id}`, 40, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de buscas próximas.", 429);
  }

  const url = new URL(req.url);
  const origin = parseLatLng(url.searchParams.get("lat"), url.searchParams.get("lng"));
  if (!origin) {
    return apiFailure("VALIDATION", "lat e lng são obrigatórios.", 400);
  }

  const typeParam = url.searchParams.get("type") || "all";
  const type = (["partner", "ong", "all"].includes(typeParam)
    ? typeParam
    : "all") as NearbyEntityType | "all";

  const results = await searchNearby({
    origin,
    radiusKm: clampRadiusKm(url.searchParams.get("radiusKm"), 10),
    type,
    category: url.searchParams.get("category") || undefined,
    city: url.searchParams.get("city") || undefined,
    state: url.searchParams.get("state") || undefined,
    userId: user!.id,
  });

  return apiSuccess({ results, origin, radiusKm: clampRadiusKm(url.searchParams.get("radiusKm"), 10) });
}
