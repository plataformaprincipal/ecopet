"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleMap } from "@/components/maps/google-map";
import { MapMarker } from "@/components/maps/map-marker";
import { LocationPermissionButton } from "@/components/maps/location-permission";
import { MapFallback } from "@/components/maps/map-fallback";
import { isGoogleMapsClientReady } from "@/lib/google-maps/config";
import { isValidLatLng } from "@/lib/google-maps/validation";
import type { LatLng, StructuredAddress } from "@/lib/google-maps/types";
import { useTranslation } from "@/providers/i18n-provider";

export function AddressMapPicker({
  latitude,
  longitude,
  onConfirm,
  draggable = true,
}: {
  latitude?: number | null;
  longitude?: number | null;
  onConfirm: (coords: LatLng, reverse?: StructuredAddress | null) => void;
  draggable?: boolean;
}) {
  const { t } = useTranslation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pos, setPos] = useState<LatLng | null>(
    isValidLatLng({ lat: latitude ?? NaN, lng: longitude ?? NaN })
      ? { lat: latitude!, lng: longitude! }
      : null
  );
  const [pendingReverse, setPendingReverse] = useState<StructuredAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isValidLatLng({ lat: latitude ?? NaN, lng: longitude ?? NaN })) {
      setPos({ lat: latitude!, lng: longitude! });
    }
  }, [latitude, longitude]);

  const reverse = useCallback(async (coords: LatLng) => {
    setBusy(true);
    try {
      const res = await fetch("/api/maps/reverse-geocode", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
      });
      const json = await res.json();
      if (res.ok && json.data?.address) {
        setPendingReverse(json.data.address as StructuredAddress);
      } else {
        setPendingReverse(null);
      }
    } catch {
      setPendingReverse(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const onDragEnd = useCallback(
    (coords: LatLng) => {
      setPos(coords);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void reverse(coords), 800);
    },
    [reverse]
  );

  if (!isGoogleMapsClientReady()) {
    return <MapFallback message={t("maps.unavailable")} />;
  }

  if (!pos) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("maps.noCoordinatesYet")}</p>
        <LocationPermissionButton
          onLocated={(p) => {
            setPos(p);
            void reverse(p);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GoogleMap
        center={pos}
        zoom={16}
        ariaLabel={t("maps.mapLabel")}
        onMapReady={setMap}
        className="h-64 w-full overflow-hidden rounded-lg border"
      />
      <MapMarker map={map} position={pos} draggable={draggable} onDragEnd={onDragEnd} title={t("maps.marker")} />
      <div className="flex flex-wrap gap-2">
        <LocationPermissionButton
          onLocated={(p) => {
            setPos(p);
            map?.panTo(p);
            void reverse(p);
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => onConfirm(pos, pendingReverse)}
        >
          {t("maps.confirmLocation")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => map?.panTo(pos)}
        >
          {t("maps.recenter")}
        </Button>
      </div>
      {pendingReverse?.formattedAddress ? (
        <p className="text-xs text-muted-foreground" role="status">
          {t("maps.reverseHint")}: {pendingReverse.formattedAddress}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{t("maps.editManualHint")}</p>
    </div>
  );
}
