import "server-only";

import { getGoogleMapsServerApiKey } from "./server-config";
import { GoogleMapsApiError, GoogleMapsConfigError, sanitizeMapsErrorMessage } from "./errors";
import { parseGoogleAddressComponents } from "./places";
import { sanitizeGeocodeQuery, isValidLatLng } from "./validation";
import type { LatLng, StructuredAddress } from "./types";
import { recordMapsUsage } from "./metrics";

type GeocodeApiResult = {
  results?: Array<{
    formatted_address?: string;
    place_id?: string;
    geometry?: {
      location?: { lat: number; lng: number };
      location_type?: string;
    };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status?: string;
  error_message?: string;
};

function mapResult(raw: NonNullable<GeocodeApiResult["results"]>[number]): StructuredAddress {
  const lat = raw.geometry?.location?.lat;
  const lng = raw.geometry?.location?.lng;
  return parseGoogleAddressComponents(raw.address_components || [], {
    formattedAddress: raw.formatted_address,
    placeId: raw.place_id,
    lat,
    lng,
  });
}

export async function geocodeAddressQuery(
  query: string,
  opts?: { userId?: string }
): Promise<StructuredAddress | null> {
  const q = sanitizeGeocodeQuery(query);
  if (!q) return null;

  const key = getGoogleMapsServerApiKey();
  if (!key) {
    throw new GoogleMapsConfigError("NOT_CONFIGURED", "Google Maps não configurado");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", q);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as GeocodeApiResult;
    if (data.status === "ZERO_RESULTS") {
      await recordMapsUsage({ action: "GEOCODE", success: true, userId: opts?.userId, metadata: { zero: true } });
      return null;
    }
    if (data.status !== "OK" || !data.results?.[0]) {
      await recordMapsUsage({
        action: "GEOCODE",
        success: false,
        userId: opts?.userId,
        errorCode: data.status || "ERROR",
      });
      throw new GoogleMapsApiError(
        data.status || "GEOCODE_FAILED",
        sanitizeMapsErrorMessage(data.error_message || data.status),
        data.status === "OVER_QUERY_LIMIT" || data.status === "UNKNOWN_ERROR"
      );
    }
    await recordMapsUsage({ action: "GEOCODE", success: true, userId: opts?.userId });
    const parsed = mapResult(data.results[0]);
    if (data.results[0].geometry?.location_type) {
      parsed.locationAccuracy = data.results[0].geometry.location_type;
    }
    return parsed;
  } catch (err) {
    if (err instanceof GoogleMapsApiError || err instanceof GoogleMapsConfigError) throw err;
    await recordMapsUsage({
      action: "GEOCODE",
      success: false,
      userId: opts?.userId,
      errorCode: "NETWORK",
    });
    throw new GoogleMapsApiError("NETWORK", "Falha de rede no geocoding", true);
  }
}

export async function reverseGeocodeLatLng(
  point: LatLng,
  opts?: { userId?: string }
): Promise<StructuredAddress | null> {
  if (!isValidLatLng(point)) return null;
  const key = getGoogleMapsServerApiKey();
  if (!key) {
    throw new GoogleMapsConfigError("NOT_CONFIGURED", "Google Maps não configurado");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${point.lat},${point.lng}`);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as GeocodeApiResult;
    if (data.status === "ZERO_RESULTS") {
      await recordMapsUsage({ action: "REVERSE_GEOCODE", success: true, userId: opts?.userId, metadata: { zero: true } });
      return null;
    }
    if (data.status !== "OK" || !data.results?.[0]) {
      await recordMapsUsage({
        action: "REVERSE_GEOCODE",
        success: false,
        userId: opts?.userId,
        errorCode: data.status || "ERROR",
      });
      throw new GoogleMapsApiError(
        data.status || "REVERSE_FAILED",
        sanitizeMapsErrorMessage(data.error_message || data.status),
        data.status === "OVER_QUERY_LIMIT"
      );
    }
    await recordMapsUsage({ action: "REVERSE_GEOCODE", success: true, userId: opts?.userId });
    return mapResult(data.results[0]);
  } catch (err) {
    if (err instanceof GoogleMapsApiError || err instanceof GoogleMapsConfigError) throw err;
    await recordMapsUsage({
      action: "REVERSE_GEOCODE",
      success: false,
      userId: opts?.userId,
      errorCode: "NETWORK",
    });
    throw new GoogleMapsApiError("NETWORK", "Falha de rede no reverse geocoding", true);
  }
}
