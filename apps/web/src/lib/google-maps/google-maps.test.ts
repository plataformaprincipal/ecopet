import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getGoogleMapsPublicApiKey,
  isGoogleMapsClientReady,
  isGoogleMapsPublicConfigured,
  NEARBY_RADIUS_OPTIONS_KM,
} from "./config";
import {
  haversineDistanceKm,
  haversineDistance,
  isWithinRadiusKm,
  boundingBox,
  sortByDistanceKm,
} from "./distance";
import {
  clampRadiusKm,
  isValidLatLng,
  parseLatLng,
  sanitizeGeocodeQuery,
  approximateCoordinates,
  hasMinimumManualAddress,
  buildGoogleMapsExternalUrl,
} from "./validation";
import { parseGoogleAddressComponents } from "./places";
import { sanitizeMapsErrorMessage } from "./errors";

describe("google maps public config", () => {
  it("returns null when key missing", () => {
    const env = {} as NodeJS.ProcessEnv;
    assert.equal(getGoogleMapsPublicApiKey(env), null);
    assert.equal(isGoogleMapsPublicConfigured(env), false);
    assert.equal(isGoogleMapsClientReady(env), false);
  });

  it("accepts NEXT_PUBLIC key", () => {
    const env = {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIzaSyTestKeyValidLength123",
    } as unknown as NodeJS.ProcessEnv;
    assert.ok(getGoogleMapsPublicApiKey(env));
    assert.equal(isGoogleMapsClientReady(env), true);
  });

  it("rejects placeholders", () => {
    const env = {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIzaSyxxxxx",
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(getGoogleMapsPublicApiKey(env), null);
  });

  it("respects disabled flag", () => {
    const env = {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIzaSyTestKeyValidLength123",
      GOOGLE_MAPS_ENABLED: "false",
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(isGoogleMapsClientReady(env), false);
  });
});

describe("distance / haversine", () => {
  it("computes known approximate distance SP-RJ", () => {
    const sp = { lat: -23.5505, lng: -46.6333 };
    const rj = { lat: -22.9068, lng: -43.1729 };
    const km = haversineDistanceKm(sp, rj);
    assert.ok(km > 350 && km < 450);
    const d = haversineDistance(sp, rj);
    assert.equal(d.source, "local");
    assert.equal(d.mode, "haversine");
  });

  it("radius check and sort", () => {
    const origin = { lat: -23.55, lng: -46.63 };
    const near = { latitude: -23.56, longitude: -46.64 };
    const far = { latitude: -22.9, longitude: -43.2 };
    assert.equal(isWithinRadiusKm(origin, { lat: near.latitude, lng: near.longitude }, 5), true);
    const sorted = sortByDistanceKm(origin, [far, near]);
    assert.equal(sorted[0].latitude, near.latitude);
  });

  it("bounding box expands with radius", () => {
    const box = boundingBox({ lat: 0, lng: 0 }, 10);
    assert.ok(box.maxLat > 0 && box.minLat < 0);
  });
});

describe("validation", () => {
  it("validates lat/lng and radius options", () => {
    assert.equal(isValidLatLng({ lat: -23, lng: -46 }), true);
    assert.equal(isValidLatLng({ lat: 100, lng: 0 }), false);
    assert.deepEqual(parseLatLng("-23.5", "-46.6"), { lat: -23.5, lng: -46.6 });
    assert.ok(NEARBY_RADIUS_OPTIONS_KM.includes(10));
    assert.equal(clampRadiusKm(10), 10);
    assert.equal(clampRadiusKm(999), 50);
  });

  it("sanitizes geocode query and builds external url", () => {
    assert.equal(sanitizeGeocodeQuery("ab"), null);
    assert.equal(sanitizeGeocodeQuery("https://evil.com"), null);
    assert.ok(sanitizeGeocodeQuery("Rua das Flores, São Paulo")?.includes("Flores"));
    const url = buildGoogleMapsExternalUrl({ lat: -23.5, lng: -46.6 });
    assert.ok(url.startsWith("https://www.google.com/maps/"));
    assert.ok(!url.includes("evil"));
  });

  it("approximates coordinates and manual address check", () => {
    const a = approximateCoordinates(-23.5505123, -46.6333123);
    assert.equal(a.lat, -23.551);
    assert.equal(
      hasMinimumManualAddress({
        street: "Rua A",
        city: "SP",
        state: "SP",
        postalCode: "01310100",
        number: "100",
        neighborhood: "Bela Vista",
        country: "BR",
      }),
      true
    );
  });
});

describe("places parsing", () => {
  it("parses google address components", () => {
    const addr = parseGoogleAddressComponents(
      [
        { long_name: "100", short_name: "100", types: ["street_number"] },
        { long_name: "Avenida Paulista", short_name: "Av. Paulista", types: ["route"] },
        { long_name: "Bela Vista", short_name: "Bela Vista", types: ["sublocality_level_1"] },
        { long_name: "São Paulo", short_name: "São Paulo", types: ["administrative_area_level_2"] },
        { long_name: "São Paulo", short_name: "SP", types: ["administrative_area_level_1"] },
        { long_name: "01310-100", short_name: "01310-100", types: ["postal_code"] },
        { long_name: "Brasil", short_name: "BR", types: ["country"] },
      ],
      { formattedAddress: "Av. Paulista, 100", placeId: "abc", lat: -23.56, lng: -46.65 }
    );
    assert.equal(addr.street, "Avenida Paulista");
    assert.equal(addr.number, "100");
    assert.equal(addr.state, "SP");
    assert.equal(addr.placeId, "abc");
    assert.equal(addr.latitude, -23.56);
  });
});

describe("error sanitization", () => {
  it("redacts api keys from messages", () => {
    const s = sanitizeMapsErrorMessage("Request denied key=AIzaSySecretValue1234567890");
    assert.ok(!s.includes("AIzaSySecret"));
  });
});
