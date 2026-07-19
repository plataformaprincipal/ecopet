"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleMap } from "@/components/maps/google-map";
import { MapMarker } from "@/components/maps/map-marker";
import { LocationPermissionButton } from "@/components/maps/location-permission";
import { MapFallback } from "@/components/maps/map-fallback";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";
import { buildGoogleMapsExternalUrl } from "@/lib/google-maps/validation";
import type { LatLng, RouteResult } from "@/lib/google-maps/types";
import { useTranslation } from "@/providers/i18n-provider";

export function RouteMap({
  destination,
  destinationName,
}: {
  destination: LatLng;
  destinationName?: string;
}) {
  const { t } = useTranslation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(
    async (from: LatLng) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/maps/route", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: from,
            destination,
            mode: "driving",
          }),
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          setError(json.error?.message ?? t("maps.routeFailed"));
          return;
        }
        setRoute(json.data as RouteResult);
      } catch {
        setError(t("maps.routeFailed"));
      } finally {
        setBusy(false);
      }
    },
    [destination, t]
  );

  if (!isGoogleMapsClientReady()) {
    return (
      <div className="space-y-2">
        <MapFallback />
        <a
          className="text-sm text-ecopet-green underline"
          href={buildGoogleMapsExternalUrl(destination)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("maps.openInGoogleMaps")}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GoogleMap
        center={origin || destination}
        zoom={13}
        className="h-64 w-full overflow-hidden rounded-lg border"
        ariaLabel={t("maps.routeMapLabel")}
        onMapReady={setMap}
      />
      <MapMarker map={map} position={destination} title={destinationName || t("maps.destination")} />
      {origin ? <MapMarker map={map} position={origin} title={t("maps.origin")} /> : null}

      <LocationPermissionButton
        onLocated={(p) => {
          setOrigin(p);
          map?.panTo(p);
          void fetchRoute(p);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!origin || busy}
          onClick={() => origin && void fetchRoute(origin)}
        >
          {busy ? t("maps.calculating") : t("maps.howToGetThere")}
        </Button>
        <Button asChild size="sm" variant="outline">
          <a
            href={route?.externalMapsUrl || buildGoogleMapsExternalUrl(destination, origin)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("maps.openInGoogleMaps")}
          </a>
        </Button>
      </div>

      {route ? (
        <p className="text-sm" role="status">
          {t("maps.distance")}: {route.distanceText} · {t("maps.duration")}: {route.durationText}
          <span className="block text-xs text-muted-foreground">{t("maps.durationDisclaimer")}</span>
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
