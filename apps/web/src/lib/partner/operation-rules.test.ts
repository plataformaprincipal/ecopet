import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  requiresOperationSchedule,
  validateOperationSchedule,
  OPERATION_SCHEDULE_MESSAGE,
} from "./operation-rules";

describe("operation-rules", () => {
  it("24h não exige horários", () => {
    assert.equal(requiresOperationSchedule(["HOURS_24"]), false);
    assert.equal(
      validateOperationSchedule(["HOURS_24"], [], "", ""),
      null
    );
  });

  it("emergencial não exige horários", () => {
    assert.equal(requiresOperationSchedule(["EMERGENCY"]), false);
  });

  it("sob agendamento não exige horários", () => {
    assert.equal(requiresOperationSchedule(["BY_APPOINTMENT"]), false);
  });

  it("horário fixo exige dias e horários", () => {
    assert.equal(requiresOperationSchedule(["FIXED_HOURS"]), true);
    const err = validateOperationSchedule(["FIXED_HOURS"], [], "", "");
    assert.equal(err?.message, OPERATION_SCHEDULE_MESSAGE);
  });

  it("horários específicos exige dias e horários", () => {
    assert.equal(requiresOperationSchedule(["SPECIFIC_DAYS"]), true);
    const ok = validateOperationSchedule(["SPECIFIC_DAYS"], ["MON"], "09:00", "18:00");
    assert.equal(ok, null);
  });

  it("valida abertura menor que fechamento", () => {
    const err = validateOperationSchedule(["FIXED_HOURS"], ["MON"], "18:00", "09:00");
    assert.match(err?.message ?? "", /fechamento/);
  });

  it("modo fixo + agendamento ainda exige horários", () => {
    assert.equal(requiresOperationSchedule(["BY_APPOINTMENT", "FIXED_HOURS"]), true);
  });
});
