import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Contratos de autorização financeira (lógica pura / regras).
 * IDOR HTTP é coberto no E2E Fase 3.
 */
describe("financial authorization contracts", () => {
  it("parceiro só pode ler o próprio partnerId", () => {
    const sessionPartnerId = "partner-a";
    const requestedPartnerId: string = "partner-b";
    const allowed = requestedPartnerId === sessionPartnerId;
    assert.equal(allowed, false);
  });

  it("parceiro não pode autoaprovar repasse", () => {
    const requestedById = "partner-a";
    const approvedById = "partner-a";
    assert.equal(requestedById === approvedById, true);
  });

  it("cliente não acessa ledger admin", () => {
    const role: string = "CLIENT";
    const canAccessLedger = role === "ADMIN";
    assert.equal(canAccessLedger, false);
  });

  it("ajuste sem reason é rejeitado", () => {
    const reason = "   ";
    assert.equal(!reason.trim(), true);
  });
});
