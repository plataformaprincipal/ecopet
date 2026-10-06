import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AFTERCARE_REASONS,
  COMMERCE_OPS_POLICY,
  PIX_WAIT_MS,
  SELLER_REJECT_REASONS,
  isSellerAcceptExpired,
  operationalLabel,
  partnerOrderTab,
  sellerAcceptDeadline,
} from "./ops-policy";

describe("commerce ops policy", () => {
  it("centraliza prazos de Pix, boleto e aceite do seller", () => {
    assert.equal(PIX_WAIT_MS, 5 * 60 * 1000);
    assert.equal(COMMERCE_OPS_POLICY.boletoDueDays, 3);
    assert.equal(COMMERCE_OPS_POLICY.sellerAcceptMs, 4 * 60 * 60 * 1000);
    assert.equal(COMMERCE_OPS_POLICY.digitalReleaseRequiresApproved, true);
  });

  it("expira aceite do parceiro pelo prazo configurado", () => {
    const due = sellerAcceptDeadline(new Date("2026-10-06T12:00:00Z"), 1000);
    assert.equal(isSellerAcceptExpired(due, Date.parse("2026-10-06T12:00:02Z")), true);
    assert.equal(isSellerAcceptExpired(due, Date.parse("2026-10-06T12:00:00Z")), false);
  });

  it("classifica pedidos do parceiro em abas operacionais", () => {
    assert.equal(partnerOrderTab("PAID"), "novos");
    assert.equal(partnerOrderTab("CONFIRMED"), "aceitos");
    assert.equal(partnerOrderTab("PREPARING"), "preparacao");
    assert.equal(partnerOrderTab("SHIPPED"), "andamento");
    assert.equal(partnerOrderTab("DELIVERED"), "concluidos");
    assert.equal(partnerOrderTab("CANCELLED"), "cancelados");
    assert.equal(partnerOrderTab("REFUNDED"), "problemas");
  });

  it("separa rótulos de produto e serviço e exige motivo de recusa", () => {
    assert.equal(operationalLabel("PAID"), "Pagamento aprovado · aguardando o parceiro");
    assert.equal(operationalLabel("CONFIRMED", "service"), "Aceito");
    assert.ok(SELLER_REJECT_REASONS.includes("OUT_OF_STOCK"));
    assert.ok(AFTERCARE_REASONS.includes("EXCHANGE"));
  });
});
