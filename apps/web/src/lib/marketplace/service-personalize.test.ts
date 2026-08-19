import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bayesianRating } from "./ranking";
import {
  compareServiceValue,
  isOpenOnWeekday,
  isServiceCompatibleWithPet,
  servicePersonalizationScore,
  serviceValueScore,
  speciesCompatibilityScore,
  weekdayInSaoPaulo,
} from "./service-personalize";
import { suggestedServiceSlugsForSpecies, serviceEnumsForGroup, getServiceVertical } from "./service-verticals";

describe("serviço — disponibilidade weekday", () => {
  it("weekday em São Paulo é 0–6", () => {
    const day = weekdayInSaoPaulo(new Date("2026-08-18T15:00:00-03:00"));
    assert.ok(day >= 0 && day <= 6);
    assert.equal(day, 2);
  });

  it("sem slots não afirma atendimento hoje", () => {
    assert.equal(isOpenOnWeekday([]), false);
    assert.equal(isOpenOnWeekday(null), false);
    assert.equal(isOpenOnWeekday([{ weekday: 2, isActive: false }], 2), false);
    assert.equal(isOpenOnWeekday([{ weekday: 2, isActive: true }], 2), true);
    assert.equal(isOpenOnWeekday([{ weekday: 1, isActive: true }], 2), false);
  });
});

describe("serviço — pet e espécie", () => {
  it("serviço sem espécie vale para qualquer pet; incompatível zera", () => {
    assert.equal(isServiceCompatibleWithPet(null, "DOG"), true);
    assert.equal(isServiceCompatibleWithPet("DOG", "DOG"), true);
    assert.equal(isServiceCompatibleWithPet("CAT", "DOG"), false);
    assert.ok(speciesCompatibilityScore("DOG", "DOG") > speciesCompatibilityScore(null, "DOG"));
    assert.ok(speciesCompatibilityScore(null, "DOG") > speciesCompatibilityScore("CAT", "DOG"));
  });

  it("sugestões usam só slugs reais e não oferecem passeador para gato", () => {
    const dog = suggestedServiceSlugsForSpecies("DOG");
    const cat = suggestedServiceSlugsForSpecies("CAT");
    assert.ok(dog.includes("passeador"));
    assert.equal(cat.includes("passeador"), false);
    assert.ok(cat.includes("veterinario"));
  });
});

describe("serviço — custo-benefício e ranking", () => {
  it("barato bem avaliado vence caro com 1 review 5★", () => {
    const cheap = { rating: 4.6, reviewCount: 80, price: 80 };
    const newbie = { rating: 5, reviewCount: 1, price: 400 };
    assert.ok(serviceValueScore(cheap.rating, cheap.reviewCount, cheap.price) > serviceValueScore(newbie.rating, newbie.reviewCount, newbie.price));
    assert.ok(compareServiceValue(cheap, newbie) < 0);
    assert.equal(serviceValueScore(4, 10, 0), 0);
  });

  it("personalização combina pet próximo verificado acima de incompatível longe", () => {
    const forThor = servicePersonalizationScore({
      petSpecies: "DOG",
      serviceSpecies: "DOG",
      distanceKm: 2,
      rating: 4.5,
      reviewCount: 40,
      openToday: true,
      price: 90,
      verified: true,
    });
    const forCatFar = servicePersonalizationScore({
      petSpecies: "DOG",
      serviceSpecies: "CAT",
      distanceKm: 45,
      rating: 5,
      reviewCount: 1,
      openToday: false,
      price: 40,
      verified: false,
    });
    assert.ok(forThor > forCatFar);
    assert.ok(bayesianRating(4.9, 500) > bayesianRating(5, 1));
  });
});

describe("verticais de serviço", () => {
  it("saúde mapeia enums reais e adoção/memória não viram categoria", () => {
    const health = serviceEnumsForGroup("health");
    assert.ok(health?.includes("VETERINARY"));
    assert.ok(health?.includes("VET_CONSULTATION"));
    assert.equal(serviceEnumsForGroup("adoption"), undefined);
    assert.equal(serviceEnumsForGroup("memory"), undefined);
    assert.equal(getServiceVertical("adoption")?.kind, "cta");
    assert.equal(getServiceVertical("memory")?.kind, "empty");
  });
});
