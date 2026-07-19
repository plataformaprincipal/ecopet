"use client";

export {
  loadGoogleMaps,
  getGoogleMapsLoaderState,
  resetGoogleMapsLoaderForTests,
} from "./loader";

export {
  getGoogleMapsPublicApiKey,
  isGoogleMapsClientReady,
  isGoogleMapsPublicConfigured,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  NEARBY_RADIUS_OPTIONS_KM,
} from "./config";

export {
  parseGoogleAddressComponents,
  parseLegacyPlaceResult,
  structuredToAddressByCepFields,
} from "./places";

export {
  haversineDistanceKm,
  haversineDistance,
  isWithinRadiusKm,
} from "./distance";

export {
  isValidLatLng,
  parseLatLng,
  clampRadiusKm,
  approximateCoordinates,
  hasMinimumManualAddress,
  buildGoogleMapsExternalUrl,
} from "./validation";
