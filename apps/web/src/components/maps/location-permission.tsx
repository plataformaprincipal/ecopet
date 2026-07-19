"use client";

import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useTranslation } from "@/providers/i18n-provider";
import type { LatLng } from "@/lib/google-maps/types";

export function LocationPermissionButton({
  onLocated,
  className,
}: {
  onLocated: (pos: LatLng) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const geo = useGeolocation();

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={geo.state === "requesting"}
        onClick={() => {
          geo.request();
        }}
        aria-describedby="geo-purpose"
      >
        {geo.state === "requesting" ? t("maps.locating") : t("maps.useMyLocation")}
      </Button>
      <p id="geo-purpose" className="mt-1 text-xs text-muted-foreground">
        {t("maps.locationPurpose")}
      </p>
      {geo.state === "denied" ? (
        <p className="mt-1 text-xs text-amber-700" role="status">
          {t("maps.locationDenied")}
        </p>
      ) : null}
      {geo.state === "granted" && geo.position ? (
        <p className="mt-1 text-xs text-ecopet-green" role="status">
          {t("maps.locationGranted")}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => onLocated(geo.position!)}
          >
            {t("maps.applyLocation")}
          </button>
        </p>
      ) : null}
      {(geo.state === "timeout" || geo.state === "unavailable" || geo.state === "error") && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {t("maps.locationUnavailable")}
        </p>
      )}
    </div>
  );
}
