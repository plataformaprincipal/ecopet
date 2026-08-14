import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Espelha a regra de combinação de filtros de adoção (meta JSON). */
function matchAdoptionMeta(
  meta: {
    sex?: string;
    size?: string;
    vaccinated?: boolean;
    neutered?: boolean;
  },
  filters: {
    sex?: string;
    size?: string;
    vaccinated?: boolean;
    species?: string;
  },
  listingSpecies?: string
) {
  if (filters.species && listingSpecies && filters.species !== listingSpecies) return false;
  if (filters.sex) {
    const metaSex = (meta.sex || "").toLowerCase();
    if (filters.sex === "unknown") {
      if (metaSex) return false;
    } else if (metaSex !== filters.sex) return false;
  }
  if (filters.size && (meta.size || "").toLowerCase() !== filters.size) return false;
  if (filters.vaccinated !== undefined && Boolean(meta.vaccinated) !== filters.vaccinated) return false;
  return true;
}

describe("adoption filters", () => {
  it("filtra species", () => {
    assert.equal(matchAdoptionMeta({}, { species: "DOG" }, "DOG"), true);
    assert.equal(matchAdoptionMeta({}, { species: "CAT" }, "DOG"), false);
  });

  it("filtra size", () => {
    assert.equal(matchAdoptionMeta({ size: "small" }, { size: "small" }), true);
    assert.equal(matchAdoptionMeta({ size: "large" }, { size: "small" }), false);
  });

  it("filtra vaccinated", () => {
    assert.equal(matchAdoptionMeta({ vaccinated: true }, { vaccinated: true }), true);
    assert.equal(matchAdoptionMeta({ vaccinated: false }, { vaccinated: true }), false);
  });

  it("combina múltiplos filtros", () => {
    assert.equal(
      matchAdoptionMeta(
        { size: "medium", vaccinated: true, sex: "female" },
        { size: "medium", vaccinated: true, sex: "female", species: "DOG" },
        "DOG"
      ),
      true
    );
    assert.equal(
      matchAdoptionMeta(
        { size: "medium", vaccinated: true, sex: "male" },
        { size: "medium", vaccinated: true, sex: "female", species: "DOG" },
        "DOG"
      ),
      false
    );
  });
});
