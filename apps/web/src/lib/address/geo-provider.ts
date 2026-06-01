import type { GeoProviderConfig } from "./types";
import { geocodeAddress } from "./cep-service";

export { DEFAULT_GEO_CONFIG } from "./types";

/** Ponto de extensão para Google Maps, OSM tiles e GPS. */
export async function geocodeWithProvider(
  params: {
    street: string;
    number?: string;
    city: string;
    state: string;
    district?: string;
  },
  config: GeoProviderConfig
): Promise<{ latitude: number; longitude: number } | null> {
  if (config.gpsEnabled) {
    // Reservado: navigator.geolocation
  }
  if (config.googleMapsApiKey) {
    // Reservado: Google Geocoding API
  }
  if (config.nominatimEnabled || config.openStreetMapEnabled) {
    return geocodeAddress(params);
  }
  return null;
}
