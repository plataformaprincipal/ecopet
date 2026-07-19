"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GoogleMap } from "@/components/maps/google-map";
import { MapMarker } from "@/components/maps/map-marker";
import { MapFallback } from "@/components/maps/map-fallback";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";
import type { NearbyResult } from "@/lib/google-maps/types";
import { useTranslation } from "@/providers/i18n-provider";

export function NearbyResultsMap({
  results,
  origin,
}: {
  results: NearbyResult[];
  origin?: { lat: number; lng: number } | null;
}) {
  const { t } = useTranslation();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(() => {
    if (origin) return origin;
    if (results[0]) return { lat: results[0].latitude, lng: results[0].longitude };
    return { lat: -23.55, lng: -46.63 };
  }, [origin, results]);

  if (!isGoogleMapsClientReady()) {
    return <MapFallback />;
  }

  return (
    <div className="space-y-4">
      <GoogleMap
        center={center}
        zoom={12}
        className="h-72 w-full overflow-hidden rounded-lg border"
        ariaLabel={t("maps.nearbyMapLabel")}
        onMapReady={setMap}
      />
      {origin ? <MapMarker map={map} position={origin} title={t("maps.youAreHere")} /> : null}
      {results
        .filter((r) => r.distanceKm >= 0)
        .map((r) => (
          <MapMarker
            key={`${r.type}-${r.id}`}
            map={map}
            position={{ lat: r.latitude, lng: r.longitude }}
            title={r.name}
          />
        ))}

      {/* Lista acessível — mapa não é a única interface */}
      <ul className="space-y-2" aria-label={t("maps.nearbyList")}>
        {results.map((r) => (
          <li
            key={`${r.type}-${r.id}`}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {[r.city, r.state].filter(Boolean).join(" · ")}
                {r.distanceKm >= 0 ? ` · ${r.distanceKm.toFixed(1)} km` : ` · ${t("maps.cityFallback")}`}
                {r.approximate ? ` · ${t("maps.approximateLocation")}` : ""}
              </p>
            </div>
            <Link
              className="text-ecopet-green underline-offset-2 hover:underline"
              href={
                r.type === "partner"
                  ? `/marketplace/parceiros/${r.id}`
                  : `/ong/${r.id}`
              }
            >
              {t("maps.viewDetails")}
            </Link>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="text-sm text-muted-foreground">{t("maps.noNearby")}</li>
        ) : null}
      </ul>
    </div>
  );
}
