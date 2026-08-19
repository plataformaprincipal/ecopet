import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AppointmentStatus, OrderStatus } from "@prisma/client";
import {
  adjustmentKey,
  computeEarnPoints,
  computeReversalPoints,
  earnOrderKey,
  earnServiceKey,
  expiresAtFromPolicy,
  isOrderEligibleForEarn,
  isOrderReversalStatus,
  isServiceEligibleForEarn,
  normalizeLedgerPoints,
  redeemKey,
  refundEarnFraction,
  reverseOrderKey,
  reverseServiceKey,
} from "./rules";

describe("loyalty earn rules", () => {
  it("pedido PAID é elegível e PENDING não", () => {
    assert.equal(isOrderEligibleForEarn(OrderStatus.PAID), true);
    assert.equal(isOrderEligibleForEarn(OrderStatus.DELIVERED), true);
    assert.equal(isOrderEligibleForEarn(OrderStatus.PENDING), false);
    assert.equal(isOrderEligibleForEarn(OrderStatus.CANCELLED), false);
  });

  it("serviço só pontua em COMPLETED", () => {
    assert.equal(isServiceEligibleForEarn(AppointmentStatus.COMPLETED), true);
    assert.equal(isServiceEligibleForEarn(AppointmentStatus.CONFIRMED), false);
    assert.equal(isServiceEligibleForEarn(AppointmentStatus.CANCELLED), false);
  });

  it("pedido refunded/cancelled é status de reversão", () => {
    assert.equal(isOrderReversalStatus(OrderStatus.REFUNDED), true);
    assert.equal(isOrderReversalStatus(OrderStatus.PARTIALLY_REFUNDED), true);
    assert.equal(isOrderReversalStatus(OrderStatus.PAID), false);
  });

  it("compra R$ 80 com 1 ponto/real gera 80 (floor)", () => {
    assert.equal(computeEarnPoints({ amountBrl: 80, pointsPerBrl: 1 }), 80);
    assert.equal(computeEarnPoints({ amountBrl: 80.9, pointsPerBrl: 1 }), 80);
    assert.equal(computeEarnPoints({ amountBrl: 0, pointsPerBrl: 1 }), 0);
    assert.equal(computeEarnPoints({ amountBrl: 10, pointsPerBrl: 0 }), 0);
  });

  it("teto maxEarnPerEvent limita o crédito", () => {
    assert.equal(computeEarnPoints({ amountBrl: 500, pointsPerBrl: 1, maxEarnPerEvent: 100 }), 100);
  });

  it("multiplicador de campanha aplica sobre o valor", () => {
    assert.equal(computeEarnPoints({ amountBrl: 50, pointsPerBrl: 1, multiplier: 2 }), 100);
  });
});

describe("loyalty reversal fraction", () => {
  it("usa earned * fraction, não remaining * fraction", () => {
    const first = computeReversalPoints({
      earned: 100,
      alreadyReversed: 0,
      availableBalance: 100,
      fraction: 0.3,
    });
    assert.equal(first.toReverse, 30);

    const second = computeReversalPoints({
      earned: 100,
      alreadyReversed: 30,
      availableBalance: 70,
      fraction: 0.3,
    });
    assert.equal(second.toReverse, 30);
    assert.notEqual(second.toReverse, Math.floor(70 * 0.3));
  });

  it("não deixa saldo negativo; unrecovered registra o restante", () => {
    const result = computeReversalPoints({
      earned: 80,
      alreadyReversed: 0,
      availableBalance: 20,
      fraction: 1,
    });
    assert.equal(result.toReverse, 20);
    assert.equal(result.unrecovered, 60);
  });
});

describe("loyalty keys e ledger signs", () => {
  it("mesma compra gera a mesma chave", () => {
    assert.equal(earnOrderKey("o1"), "ORDER_COMPLETED:o1");
    assert.equal(reverseOrderKey("o1"), "ORDER_REFUNDED:o1");
    assert.equal(reverseOrderKey("o1", "rf9"), "ORDER_REFUNDED:o1:rf9");
    assert.equal(earnServiceKey("a1"), "SERVICE_COMPLETED:a1");
    assert.equal(reverseServiceKey("a1"), "SERVICE_REVERSED:a1");
    assert.equal(redeemKey("u1", "r1", "req"), "REDEEM:u1:r1:req");
    assert.equal(adjustmentKey("u1", "req"), "ADJUSTMENT:u1:req");
  });

  it("normaliza sinais do ledger", () => {
    assert.equal(normalizeLedgerPoints("EARN", 10), 10);
    assert.equal(normalizeLedgerPoints("BONUS", -5), 5);
    assert.equal(normalizeLedgerPoints("REDEEM", 20), -20);
    assert.equal(normalizeLedgerPoints("REVERSAL", 15), -15);
    assert.equal(normalizeLedgerPoints("EXPIRE", 8), -8);
  });

  it("expiração none não define data", () => {
    assert.equal(expiresAtFromPolicy(null), undefined);
    assert.equal(expiresAtFromPolicy(0), undefined);
    const at = expiresAtFromPolicy(10, new Date("2026-01-01T00:00:00Z"));
    assert.ok(at);
    assert.equal(at.toISOString(), "2026-01-11T00:00:00.000Z");
  });
});

describe("refundEarnFraction", () => {
  it("estorno total reverte 100%", () => {
    assert.equal(refundEarnFraction({ fullRefund: true, orderTotal: 80 }), 1);
  });

  it("parcial sem amount não inventa 100% — retorna null para pular", () => {
    assert.equal(refundEarnFraction({ fullRefund: false, orderTotal: 80 }), null);
  });

  it("parcial com amount usa a fração do pedido", () => {
    assert.equal(refundEarnFraction({ fullRefund: false, refundAmount: 20, orderTotal: 80 }), 0.25);
  });
});
