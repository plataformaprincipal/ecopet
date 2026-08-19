import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VerificationStatus } from "@prisma/client";
import {
  MARKETPLACE_DEFAULT_RADIUS_KM,
  MARKETPLACE_FEATURES,
  clampPriceRange,
  countActiveMarketplaceFilters,
  enabledMarketplaceSorts,
  marketplaceCacheKey,
  mergeMarketplaceQuery,
  nextRadiusKm,
  parseMarketplaceQuery,
  parseMarketplaceSort,
  parseMarketplaceType,
  serializeMarketplaceQuery,
} from "./query-model";
import { publicVerificationWhere } from "./parse-request";

describe("marketplace query model", () => {
  it("parseia verifiedOnly da URL", () => {
    const q = parseMarketplaceQuery(new URLSearchParams("verifiedOnly=true"));
    assert.equal(q.verifiedOnly, true);
    assert.equal(serializeMarketplaceQuery(q).get("verifiedOnly"), "true");
  });

  it("aceita alias verified=1", () => {
    const q = parseMarketplaceQuery(new URLSearchParams("verified=1"));
    assert.equal(q.verifiedOnly, true);
  });

  it("não serializa freeShipping enquanto o dado não existe", () => {
    assert.equal(MARKETPLACE_FEATURES.freeShipping, false);
    const q = parseMarketplaceQuery(new URLSearchParams("freeShipping=true"));
    assert.equal(q.freeShipping, undefined);
    assert.equal(serializeMarketplaceQuery({ freeShipping: true }).has("freeShipping"), false);
  });

  it("valida min <= max invertendo a faixa", () => {
    assert.deepEqual(clampPriceRange(100, 50), { minPrice: 50, maxPrice: 100 });
    const q = parseMarketplaceQuery(new URLSearchParams("minPrice=200&maxPrice=80"));
    assert.equal(q.minPrice, 80);
    assert.equal(q.maxPrice, 200);
  });

  it("parseia type e category reais", () => {
    const q = parseMarketplaceQuery(new URLSearchParams("type=product&category=alimentacao"));
    assert.equal(q.type, "product");
    assert.equal(q.category, "alimentacao");
    assert.equal(parseMarketplaceType("services"), "service");
    assert.equal(parseMarketplaceType("partners"), "partner");
  });

  it("mapeia sort nearest/distance para near_me", () => {
    assert.equal(parseMarketplaceSort("nearest"), "near_me");
    assert.equal(parseMarketplaceSort("distance"), "near_me");
    assert.equal(parseMarketplaceSort("ai"), "relevance");
  });

  it("near usa raio default 10 km e não coloca lat/lng na URL", () => {
    const q = parseMarketplaceQuery(new URLSearchParams("near=1&sort=near_me"));
    assert.equal(q.near, true);
    assert.equal(q.radiusKm, MARKETPLACE_DEFAULT_RADIUS_KM);
    const params = serializeMarketplaceQuery(q);
    assert.equal(params.get("near"), "1");
    assert.equal(params.get("radiusKm"), "10");
    assert.equal(params.has("lat"), false);
    assert.equal(params.has("lng"), false);
  });

  it("cache key usa bucket, não coordenada exata", () => {
    const key = marketplaceCacheKey({ type: "product", q: "ração" }, { lat: -7.11951234, lng: -34.84509876 });
    assert.match(key, /marketplace/);
    assert.doesNotMatch(key, /-7\.11951234/);
  });

  it("conta filtros ativos", () => {
    assert.equal(countActiveMarketplaceFilters({ verifiedOnly: true, minRating: 4, near: true }), 3);
  });

  it("esconde sorts sem dado de frete/ETA", () => {
    const values = enabledMarketplaceSorts().map((s) => s.value);
    assert.ok(values.includes("near_me"));
    assert.ok(values.includes("price_asc"));
    assert.equal(values.includes("fastest_delivery"), false);
    assert.equal(values.includes("shipping_cost"), false);
    assert.equal(values.includes("total_cost"), false);
  });

  it("merge reseta página e aplica raio ao near", () => {
    const next = mergeMarketplaceQuery({ type: "all", page: 3 }, { near: true, verifiedOnly: true });
    assert.equal(next.page, 1);
    assert.equal(next.near, true);
    assert.equal(next.radiusKm, 10);
    assert.equal(next.verifiedOnly, true);
  });

  it("próximo raio a partir de 2 km é 5 km", () => {
    assert.equal(nextRadiusKm(2), 5);
    assert.equal(nextRadiusKm(50), undefined);
  });

  it("parseia filtros de serviço sem lat/lng na URL", () => {
    const q = parseMarketplaceQuery(new URLSearchParams("group=health&openToday=true&telehealth=1&sort=value"));
    assert.equal(q.group, "health");
    assert.equal(q.openToday, true);
    assert.equal(q.telehealth, true);
    assert.equal(q.sort, "value");
    const params = serializeMarketplaceQuery(q);
    assert.equal(params.get("group"), "health");
    assert.equal(params.get("openToday"), "true");
    assert.equal(params.get("telehealth"), "true");
    assert.equal(params.get("sort"), "value");
    assert.equal(params.has("lat"), false);
  });

  it("sort value só aparece no dropdown de serviços", () => {
    assert.equal(enabledMarketplaceSorts("product").some((s) => s.value === "value"), false);
    assert.equal(enabledMarketplaceSorts("service").some((s) => s.value === "value"), true);
  });
});

describe("verifiedOnly no backend", () => {
  it("sem flag não exige APPROVED", () => {
    assert.deepEqual(publicVerificationWhere(false), {});
    assert.deepEqual(publicVerificationWhere(undefined), {});
  });

  it("verifiedOnly=true exige status real APPROVED", () => {
    const where = publicVerificationWhere(true);
    assert.equal(where.verificationStatus, VerificationStatus.APPROVED);
    assert.ok(where.approvedAt);
  });
});
