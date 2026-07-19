"use client";

import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/google-maps/config";
import type { LatLng } from "@/lib/google-maps/types";
import { MapFallback } from "@/components/maps/map-fallback";

export type GoogleMapProps = {
  center?: LatLng;
  zoom?: number;
  className?: string;
  ariaLabel?: string;
  onMapReady?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
};

/**
 * Mapa Google — carregamento sob demanda. Não usar em SSR como dependência crítica.
 */
export function GoogleMap({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  className,
  ariaLabel,
  onMapReady,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const maps = useGoogleMaps({ enabled: true });

  useEffect(() => {
    if (!maps.ready || !containerRef.current || typeof google === "undefined") return;
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(containerRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
      onMapReady?.(mapRef.current);
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
  }, [maps.ready, center.lat, center.lng, zoom, onMapReady, center]);

  if (!maps.configured) {
    return <MapFallback />;
  }

  if (maps.error) {
    return <MapFallback onRetry={() => void maps.reload()} />;
  }

  return (
    <div
      ref={containerRef}
      className={className || "h-64 w-full rounded-lg"}
      role="application"
      aria-label={ariaLabel || "Mapa"}
    >
      {maps.loading || !maps.ready ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          …
        </div>
      ) : null}
    </div>
  );
}
