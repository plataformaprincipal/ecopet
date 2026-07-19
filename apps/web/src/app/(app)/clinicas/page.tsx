"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layouts/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NearbyResultsMap } from "@/components/maps/nearby-results-map";
import { LocationPermissionButton } from "@/components/maps/location-permission";
import { MapFallback } from "@/components/maps/map-fallback";
import { useNearbySearch } from "@/hooks/use-nearby-search";
import { NEARBY_RADIUS_OPTIONS_KM, isGoogleMapsClientReady } from "@/lib/google-maps/config";
import type { LatLng } from "@/lib/google-maps/types";
import { useTranslation } from "@/providers/i18n-provider";

export default function ClinicasPage() {
  const { t } = useTranslation();
  const nearby = useNearbySearch();
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  async function runSearch(pos: LatLng, radius = radiusKm) {
    setOrigin(pos);
    await nearby.search({
      origin: pos,
      radiusKm: radius,
      type: "partner",
      category: "CLINIC",
    });
  }

  return (
    <>
      <AppHeader title={t("maps.clinicsTitle")} />
      <main className="flex-1 space-y-4 p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("maps.nearbyPartners")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocationPermissionButton onLocated={(p) => void runSearch(p)} />
            <div className="flex flex-wrap gap-2">
              {NEARBY_RADIUS_OPTIONS_KM.map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="sm"
                  variant={radiusKm === r ? "default" : "outline"}
                  onClick={() => {
                    setRadiusKm(r);
                    if (origin) void runSearch(origin, r);
                  }}
                >
                  {r} km
                </Button>
              ))}
            </div>
            {!isGoogleMapsClientReady() ? <MapFallback /> : null}
            {nearby.error ? (
              <p className="text-sm text-red-600" role="alert">
                {nearby.error}
              </p>
            ) : null}
            <NearbyResultsMap results={nearby.results} origin={origin} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
