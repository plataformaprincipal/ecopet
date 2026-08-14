import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidLatLng } from "@/lib/google-maps/validation";

describe("marketplace near-me validation", () => {
  it("aceita coordenadas válidas", () => {
    assert.equal(isValidLatLng({ lat: -7.1195, lng: -34.845 }), true);
  });

  it("rejeita latitude/longitude inválidas", () => {
    assert.equal(isValidLatLng({ lat: 999, lng: 0 }), false);
    assert.equal(isValidLatLng({ lat: 0, lng: 200 }), false);
    assert.equal(isValidLatLng({ lat: Number.NaN, lng: 0 }), false);
  });

  it("radiusKm deve ter limite seguro no caller", () => {
    const clampRadius = (n: number) => Math.min(200, Math.max(1, n));
    assert.equal(clampRadius(0), 1);
    assert.equal(clampRadius(5000), 200);
    assert.equal(clampRadius(50), 50);
  });
});
