import "server-only";

import { getGoogleMapsServerApiKey } from "./server-config";
import { GoogleMapsApiError, GoogleMapsConfigError, sanitizeMapsErrorMessage } from "./errors";
import { buildGoogleMapsExternalUrl, isValidLatLng } from "./validation";
import { haversineDistance } from "./distance";
import type { LatLng, RouteResult } from "./types";
import { recordMapsUsage } from "./metrics";

type DirectionsResponse = {
  status?: string;
  error_message?: string;
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: Array<{
      distance?: { value?: number; text?: string };
      duration?: { value?: number; text?: string };
    }>;
  }>;
};

const ALLOWED_MODES = new Set(["driving", "walking", "bicycling", "transit"]);

export async function computeRoute(params: {
  origin: LatLng;
  destination: LatLng;
  mode?: string;
  userId?: string;
}): Promise<RouteResult> {
  if (!isValidLatLng(params.origin) || !isValidLatLng(params.destination)) {
    throw new GoogleMapsApiError("INVALID_LATLNG", "Coordenadas inválidas");
  }

  const mode = ALLOWED_MODES.has(params.mode || "") ? params.mode! : "driving";
  const externalMapsUrl = buildGoogleMapsExternalUrl(params.destination, params.origin);

  const key = getGoogleMapsServerApiKey();
  if (!key) {
    // Fallback sem API: distância em linha reta + link externo
    const h = haversineDistance(params.origin, params.destination);
    await recordMapsUsage({
      action: "ROUTE",
      success: true,
      userId: params.userId,
      metadata: { fallback: "haversine" },
    });
    return {
      distanceMeters: h.distanceMeters,
      durationSeconds: Math.round((h.distanceKm / 40) * 3600),
      distanceText: `${h.distanceKm.toFixed(1)} km (estimado)`,
      durationText: "estimativa aproximada",
      mode: "haversine",
      externalMapsUrl,
    };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${params.origin.lat},${params.origin.lng}`);
  url.searchParams.set("destination", `${params.destination.lat},${params.destination.lng}`);
  url.searchParams.set("mode", mode);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as DirectionsResponse;
    const leg = data.routes?.[0]?.legs?.[0];
    if (data.status !== "OK" || !leg?.distance?.value || !leg.duration?.value) {
      await recordMapsUsage({
        action: "ROUTE",
        success: false,
        userId: params.userId,
        errorCode: data.status || "ROUTE_FAILED",
      });
      if (!key) throw new GoogleMapsConfigError("NOT_CONFIGURED", "Google Maps não configurado");
      // fallback haversine
      const h = haversineDistance(params.origin, params.destination);
      return {
        distanceMeters: h.distanceMeters,
        durationSeconds: Math.round((h.distanceKm / 40) * 3600),
        distanceText: `${h.distanceKm.toFixed(1)} km (estimado)`,
        durationText: "estimativa aproximada",
        mode: "haversine",
        externalMapsUrl,
      };
    }

    await recordMapsUsage({ action: "ROUTE", success: true, userId: params.userId });
    return {
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
      distanceText: leg.distance.text || `${(leg.distance.value / 1000).toFixed(1)} km`,
      durationText: leg.duration.text || `${Math.round(leg.duration.value / 60)} min`,
      polyline: data.routes?.[0]?.overview_polyline?.points,
      mode,
      externalMapsUrl,
    };
  } catch (err) {
    if (err instanceof GoogleMapsApiError || err instanceof GoogleMapsConfigError) throw err;
    await recordMapsUsage({
      action: "ROUTE",
      success: false,
      userId: params.userId,
      errorCode: "NETWORK",
    });
    throw new GoogleMapsApiError(
      "NETWORK",
      sanitizeMapsErrorMessage(err instanceof Error ? err.message : "network"),
      true
    );
  }
}

export async function computeDistanceMatrix(params: {
  origin: LatLng;
  destination: LatLng;
  mode?: string;
  userId?: string;
}) {
  // Reutiliza Directions para um par — evita Distance Matrix se não necessário
  const route = await computeRoute(params);
  return {
    distanceMeters: route.distanceMeters,
    distanceKm: Math.round((route.distanceMeters / 1000) * 100) / 100,
    durationSeconds: route.durationSeconds,
    durationText: route.durationText,
    mode: route.mode,
    source: route.mode === "haversine" ? ("local" as const) : ("google" as const),
  };
}
