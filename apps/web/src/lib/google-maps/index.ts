/** Exports seguros (sem server-only / sem chave privada). */
export {
  getGoogleMapsPublicApiKey,
  isGoogleMapsPublicConfigured,
  isGoogleMapsClientReady,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  NEARBY_RADIUS_OPTIONS_KM,
  GOOGLE_MAPS_LIBRARIES,
  maskApiKeyHint,
} from "./config";

export {
  haversineDistanceKm,
  haversineDistance,
  isWithinRadiusKm,
  sortByDistanceKm,
  boundingBox,
} from "./distance";

export {
  isValidLatitude,
  isValidLongitude,
  isValidLatLng,
  parseLatLng,
  clampRadiusKm,
  sanitizeGeocodeQuery,
  approximateCoordinates,
  hasMinimumManualAddress,
  buildGoogleMapsExternalUrl,
} from "./validation";

export {
  parseGoogleAddressComponents,
  structuredToAddressByCepFields,
} from "./places";

export type {
  StructuredAddress,
  LatLng,
  DistanceResult,
  RouteResult,
  NearbyResult,
  NearbyEntityType,
  GoogleMapsLoaderState,
  GoogleMapsSanitizedStatus,
  GeocodingSource,
} from "./types";

export { sanitizeMapsErrorMessage } from "./errors";
