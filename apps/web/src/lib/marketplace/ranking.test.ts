import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bayesianRating,
  compareNearMe,
  compareTotalCost,
  isWithinRadius,
  relevanceScore,
  totalCost,
} from "./ranking";
import { haversineDistanceKm } from "@/lib/google-maps/distance";

describe("marketplace ranking", () => {
  it("totalCost soma preço + frete quando o frete existe", () => {
    const a = { price: 80, shippingCost: 20 };
    const b = { price: 90, shippingCost: 0 };
    assert.equal(totalCost(a), 100);
    assert.equal(totalCost(b), 90);
    assert.ok(compareTotalCost(b, a) < 0);
  });

  it("shipping unknown não vira custo total igual ao preço", () => {
    const c = { price: 50, shippingCost: null };
    assert.equal(totalCost(c), null);
    const known = { price: 90, shippingCost: 0 };
    assert.ok(compareTotalCost(known, c) < 0);
    assert.ok(compareTotalCost(c, known) > 0);
  });

  it("bayesian impede 5★ com 1 review de dominar 4,9★ com 500", () => {
    const newbie = bayesianRating(5, 1);
    const established = bayesianRating(4.9, 500);
    assert.ok(established > newbie);
  });

  it("relevância documentada usa rating bayesiano e proximidade", () => {
    const farUnverified = relevanceScore({ rating: 5, reviewCount: 1, verified: false, distanceKm: 40, available: true });
    const nearVerified = relevanceScore({ rating: 4.6, reviewCount: 80, verified: true, distanceKm: 2, available: true });
    assert.ok(nearVerified > farUnverified);
  });
});

describe("marketplace distance", () => {
  const joaoPessoa = { lat: -7.1195, lng: -34.845 };
  const recife = { lat: -8.0476, lng: -34.877 };

  it("Haversine entre João Pessoa e Recife fica ~100–130 km", () => {
    const km = haversineDistanceKm(joaoPessoa, recife);
    assert.ok(km > 90 && km < 140, `got ${km}`);
  });

  it("ordena nearer first", () => {
    const items = [
      { distanceKm: 12 },
      { distanceKm: null },
      { distanceKm: 3.2 },
    ];
    items.sort(compareNearMe);
    assert.equal(items[0].distanceKm, 3.2);
    assert.equal(items[1].distanceKm, 12);
    assert.equal(items[2].distanceKm, null);
  });

  it("raio exclui fora e itens sem coordenada", () => {
    assert.equal(isWithinRadius(1.2, 2), true);
    assert.equal(isWithinRadius(4.8, 2), false);
    assert.equal(isWithinRadius(null, 2), false);
    assert.equal(isWithinRadius(8, undefined), true);
  });
});
