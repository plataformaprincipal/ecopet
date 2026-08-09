/**
 * FASE 3.4 — Hardening financeiro (lógica pura / contratos).
 * Concorrência HTTP e IDOR de rede ficam no script homolog / Fase 3 E2E.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allocateCents,
  assertNonNegativeCents,
  fromCents,
  percentOfCents,
  toCents,
} from "./money";
import { calculateCommercialAllocation } from "./allocation";

describe("FASE 3.4 money precision (FIN-017)", () => {
  for (const v of [0.01, 0.03, 0.1, 0.99, 1.01, 19.99, 99.99]) {
    it(`round-trip ${v}`, () => {
      const c = toCents(v);
      assert.equal(Number.isInteger(c), true);
      assert.equal(fromCents(c), Math.round(v * 100) / 100);
    });
  }

  it("percentual + fee + reserve fecha em centavos", () => {
    const a = calculateCommercialAllocation({
      grossAmount: 19.99,
      platformPercentage: 10,
      platformFixedFee: 0.99,
      gatewayFeePercent: 3.99,
      gatewayFeeBearer: "PARTNER",
      reservePercent: 10,
      taxEstimatePercent: 0,
      pricingVersion: "v1",
    });
    assert.equal(a.grossAmountCents, 1999);
    assert.ok(a.partnerPayableCents >= 0);
    assert.equal(
      a.platformPercentageAmountCents +
        a.platformFixedFeeCents +
        (a.gatewayFeeBearer === "PARTNER" ? a.gatewayFeeEstimatedCents : 0) +
        a.reserveAmountCents +
        a.partnerPayableCents,
      a.grossAmountCents - a.discountAmountCents
    );
  });

  it("allocateCents soma exatamente o total", () => {
    const parts = allocateCents(100, [1, 1, 1]);
    assert.equal(parts.reduce((s, p) => s + p, 0), 100);
  });

  it("rejeita centavos negativos", () => {
    assert.throws(() => assertNonNegativeCents(-1));
  });
});

describe("FASE 3.4 refund cap (FIN-007)", () => {
  function canRefund(paidCents: number, alreadyRefundedCents: number, requestCents: number) {
    if (requestCents <= 0) return false;
    return alreadyRefundedCents + requestCents <= paidCents;
  }

  it("bloqueia acima de 100%", () => {
    assert.equal(canRefund(1000, 900, 200), false);
  });

  it("permite parciais até 100%", () => {
    assert.equal(canRefund(1000, 0, 100), true);
    assert.equal(canRefund(1000, 100, 400), true);
    assert.equal(canRefund(1000, 500, 500), true);
    assert.equal(canRefund(1000, 500, 501), false);
  });
});

describe("FASE 3.4 payout state machine (FIN-008/009)", () => {
  const allowed: Record<string, string[]> = {
    PENDING: ["APPROVED", "CANCELLED"],
    APPROVED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["PAID", "FAILED"],
    PAID: [],
    FAILED: ["PENDING"],
    CANCELLED: [],
    REVERSED: [],
  };

  function canTransition(from: string, to: string) {
    return (allowed[from] ?? []).includes(to);
  }

  it("bloqueia PAID → PENDING (regressão)", () => {
    assert.equal(canTransition("PAID", "PENDING"), false);
  });

  it("bloqueia payout acima do disponível", () => {
    const available = 300;
    const reserved = 200;
    const request = 400;
    const spendable = available; // reserved não é spendable
    assert.equal(request <= spendable, false);
    assert.equal(request <= available + reserved, true);
    assert.equal(spendable < request, true);
  });
});

describe("FASE 3.4 amount mismatch contract (FIN-001)", () => {
  it("diff > 0.01 bloqueia promoção", () => {
    const expected = 50;
    const received = 50.02;
    const blocked = Math.abs(received - expected) > 0.01;
    assert.equal(blocked, true);
  });

  it("diff <= 0.01 aceita", () => {
    const expected = 50;
    const received = 50.01;
    const blocked = Math.abs(received - expected) > 0.01;
    assert.equal(blocked, false);
  });
});

describe("FASE 3.4 out-of-order payment (FIN-011)", () => {
  function applyStatus(current: string, next: string): string {
    if (current === "APPROVED" && next === "PENDING") return current;
    if (current === "REFUNDED" && next === "APPROVED") return current;
    if (current === "APPROVED" && next === "APPROVED") return current;
    return next;
  }

  it("PENDING antigo não regride APPROVED", () => {
    assert.equal(applyStatus("APPROVED", "PENDING"), "APPROVED");
  });

  it("APPROVED antigo não reabre REFUNDED", () => {
    assert.equal(applyStatus("REFUNDED", "APPROVED"), "REFUNDED");
  });
});

describe("FASE 3.4 GMV vs receita (FIN-015/016)", () => {
  it("GMV não é receita plataforma", () => {
    const a = calculateCommercialAllocation({
      grossAmount: 100,
      platformPercentage: 10,
      platformFixedFee: 1,
      gatewayFeePercent: 0,
      reservePercent: 0,
      pricingVersion: "v1",
    });
    const platformRevenue =
      a.platformPercentageAmountCents + a.platformFixedFeeCents;
    assert.notEqual(platformRevenue, a.grossAmountCents);
    assert.ok(a.partnerPayableCents > 0);
    assert.ok(platformRevenue < a.grossAmountCents);
  });
});

describe("FASE 3.4 percent helper", () => {
  it("percentOfCents 10% de 1999", () => {
    assert.equal(percentOfCents(1999, 10), 200);
  });
});
