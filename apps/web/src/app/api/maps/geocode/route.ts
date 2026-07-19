import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { geocodeAddressQuery } from "@/lib/google-maps/geocoding";
import { isGoogleMapsServerConfigured } from "@/lib/google-maps/server-config";
import { GoogleMapsApiError, GoogleMapsConfigError } from "@/lib/google-maps/errors";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  query: z.string().min(3).max(300),
});

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`maps-geocode:${user!.id}`, 20, 60_000)) {
    return apiFailure("RATE_LIMIT", "Limite de geocodificação.", 429);
  }

  if (!isGoogleMapsServerConfigured()) {
    return apiFailure("NOT_CONFIGURED", "Google Maps não configurado.", 503);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiValidationError("Query inválida.");

  try {
    const address = await geocodeAddressQuery(parsed.data.query, { userId: user!.id });
    return apiSuccess({ address });
  } catch (err) {
    if (err instanceof GoogleMapsConfigError) {
      return apiFailure(err.code, err.message, 503);
    }
    if (err instanceof GoogleMapsApiError) {
      return apiFailure(err.code, err.message, err.retryable ? 503 : 400);
    }
    return apiFailure("GEOCODE_FAILED", "Falha ao geocodificar.", 500);
  }
}
