import type { DistanceResult, LatLng } from "./types";
import { isValidLatLng } from "./validation";

const EARTH_RADIUS_KM = 6371;

/** Distância em linha reta (Haversine) — sem chamada paga. */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  if (!isValidLatLng(a) || !isValidLatLng(b)) return Number.POSITIVE_INFINITY;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineDistance(a: LatLng, b: LatLng): DistanceResult {
  const km = haversineDistanceKm(a, b);
  return {
    distanceKm: Math.round(km * 100) / 100,
    distanceMeters: Math.round(km * 1000),
    mode: "haversine",
    source: "local",
  };
}

export function isWithinRadiusKm(origin: LatLng, point: LatLng, radiusKm: number): boolean {
  return haversineDistanceKm(origin, point) <= radiusKm;
}

export function sortByDistanceKm<T extends { latitude: number; longitude: number }>(
  origin: LatLng,
  items: T[]
): Array<T & { distanceKm: number }> {
  return items
    .map((item) => ({
      ...item,
      distanceKm: Math.round(haversineDistanceKm(origin, { lat: item.latitude, lng: item.longitude }) * 100) / 100,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Bounding box aproximado para pré-filtro SQL (graus). */
export function boundingBox(origin: LatLng, radiusKm: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((origin.lat * Math.PI) / 180) || 1);
  return {
    minLat: origin.lat - latDelta,
    maxLat: origin.lat + latDelta,
    minLng: origin.lng - lngDelta,
    maxLng: origin.lng + lngDelta,
  };
}
