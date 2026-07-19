export type GeocodingSource = "GOOGLE" | "NOMINATIM" | "VIACEP" | "MANUAL" | "BROWSER";

export type StructuredAddress = {
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  formattedAddress?: string;
  placeId?: string;
  latitude?: number | null;
  longitude?: number | null;
  geocodingSource?: GeocodingSource;
  locationAccuracy?: string;
};

export type LatLng = { lat: number; lng: number };

export type DistanceResult = {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds?: number;
  durationText?: string;
  mode: "haversine" | "driving" | "walking" | "bicycling" | "transit";
  source: "local" | "google";
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  polyline?: string;
  mode: string;
  externalMapsUrl: string;
};

export type NearbyEntityType = "partner" | "ong";

export type NearbyResult = {
  id: string;
  type: NearbyEntityType;
  name: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  distanceKm: number;
  latitude: number;
  longitude: number;
  approximate: boolean;
  rating?: number | null;
};

export type GoogleMapsLoaderState = "idle" | "loading" | "ready" | "error" | "unsupported";

export type GoogleMapsSanitizedStatus = {
  configured: boolean;
  publicKeyConfigured: boolean;
  serverKeyConfigured: boolean;
  environment: string;
  status: "READY" | "PARTIAL" | "MISSING" | "DISABLED";
  sanitizedMessage: string;
  expectedApis: string[];
};
