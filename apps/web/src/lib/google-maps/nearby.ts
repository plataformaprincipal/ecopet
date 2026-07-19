import "server-only";

import { prisma } from "@/lib/prisma";
import { boundingBox, sortByDistanceKm } from "./distance";
import { approximateCoordinates, clampRadiusKm, isValidLatLng } from "./validation";
import type { LatLng, NearbyEntityType, NearbyResult } from "./types";
import { recordMapsUsage } from "./metrics";

export async function searchNearby(params: {
  origin: LatLng;
  radiusKm?: number;
  type?: NearbyEntityType | "all";
  category?: string;
  city?: string;
  state?: string;
  limit?: number;
  userId?: string;
}): Promise<NearbyResult[]> {
  if (!isValidLatLng(params.origin)) return [];

  const radiusKm = clampRadiusKm(params.radiusKm, 10);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const box = boundingBox(params.origin, radiusKm);
  const type = params.type || "all";
  const results: NearbyResult[] = [];

  if (type === "all" || type === "partner") {
    const partners = await prisma.partnerProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        latitude: { gte: box.minLat, lte: box.maxLat, not: null },
        longitude: { gte: box.minLng, lte: box.maxLng, not: null },
        ...(params.category ? { category: params.category } : {}),
        ...(params.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
        ...(params.state ? { state: params.state.toUpperCase() } : {}),
      },
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
      },
      take: 200,
    });

    for (const p of partners) {
      if (p.latitude == null || p.longitude == null) continue;
      results.push({
        id: p.id,
        type: "partner",
        name: p.businessName,
        category: p.category,
        city: p.city,
        state: p.state,
        latitude: p.latitude,
        longitude: p.longitude,
        distanceKm: 0,
        approximate: false,
        rating: null,
      });
    }
  }

  if (type === "all" || type === "ong") {
    const ongs = await prisma.ongProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        publicLocationEnabled: true,
        latitude: { gte: box.minLat, lte: box.maxLat, not: null },
        longitude: { gte: box.minLng, lte: box.maxLng, not: null },
        ...(params.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
        ...(params.state ? { state: params.state.toUpperCase() } : {}),
      },
      select: {
        id: true,
        name: true,
        ongName: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        locationApproximate: true,
        focusArea: true,
      },
      take: 200,
    });

    for (const o of ongs) {
      if (o.latitude == null || o.longitude == null) continue;
      const coords = o.locationApproximate
        ? approximateCoordinates(o.latitude, o.longitude)
        : { lat: o.latitude, lng: o.longitude };
      results.push({
        id: o.id,
        type: "ong",
        name: o.ongName || o.name,
        category: o.focusArea,
        city: o.city,
        state: o.state,
        latitude: coords.lat,
        longitude: coords.lng,
        distanceKm: 0,
        approximate: o.locationApproximate,
      });
    }
  }

  // Fallback cidade/estado sem coords no bbox (sem lat) — só se poucos resultados
  if (results.length < 5 && (params.city || params.state)) {
    if (type === "all" || type === "partner") {
      const textPartners = await prisma.partnerProfile.findMany({
        where: {
          verificationStatus: "APPROVED",
          OR: [{ latitude: null }, { longitude: null }],
          ...(params.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
          ...(params.state ? { state: params.state.toUpperCase() } : {}),
          ...(params.category ? { category: params.category } : {}),
        },
        select: {
          id: true,
          businessName: true,
          category: true,
          city: true,
          state: true,
        },
        take: 10,
      });
      for (const p of textPartners) {
        if (results.some((r) => r.id === p.id)) continue;
        results.push({
          id: p.id,
          type: "partner",
          name: p.businessName,
          category: p.category,
          city: p.city,
          state: p.state,
          latitude: params.origin.lat,
          longitude: params.origin.lng,
          distanceKm: Number.NaN,
          approximate: true,
        });
      }
    }
  }

  const withCoords = results.filter((r) => !Number.isNaN(r.distanceKm) || (r.latitude && r.longitude));
  const ranked = sortByDistanceKm(
    params.origin,
    withCoords
      .filter((r) => !r.approximate || (r.latitude !== params.origin.lat))
      .map((r) => ({
        ...r,
        latitude: r.latitude,
        longitude: r.longitude,
      }))
  ).filter((r) => r.distanceKm <= radiusKm);

  // incluir fallbacks de texto no fim
  const textOnly = results.filter((r) => Number.isNaN(r.distanceKm));
  const final = [...ranked, ...textOnly.map((r) => ({ ...r, distanceKm: -1 }))].slice(0, limit);

  await recordMapsUsage({
    action: "NEARBY",
    success: true,
    userId: params.userId,
    metadata: { count: final.length, radiusKm, type },
  });

  return final;
}
