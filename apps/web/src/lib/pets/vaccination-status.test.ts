import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { vaccinationStatus } from "./vaccination-status";

describe("vaccinationStatus", () => {
  it("SEM_DATA sem nextDue", () => {
    assert.equal(vaccinationStatus(null), "SEM_DATA");
    assert.equal(vaccinationStatus(undefined), "SEM_DATA");
  });

  it("ATRASADA no passado", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    assert.equal(vaccinationStatus(past), "ATRASADA");
  });

  it("PROXIMA em até 30 dias", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    assert.equal(vaccinationStatus(soon), "PROXIMA");
  });

  it("EM_DIA além de 30 dias", () => {
    const later = new Date();
    later.setDate(later.getDate() + 60);
    assert.equal(vaccinationStatus(later), "EM_DIA");
  });
});
