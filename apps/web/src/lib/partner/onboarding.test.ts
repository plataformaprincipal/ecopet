import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluatePartnerOnboarding,
  hasBankingDetails,
  maskFinancialDetails,
  SELLER_NOT_ENABLED_MESSAGE,
} from "./onboarding";

describe("partner onboarding", () => {
  it("parceiro incompleto não vende e pede para finalizar a conta", () => {
    const snap = evaluatePartnerOnboarding({
      accountStatus: "PENDING",
      verificationStatus: "PENDING",
      businessName: "Pet Shop Central",
      legalName: "Pet Shop Central LTDA",
      address: "Rua A",
      city: "João Pessoa",
    });
    assert.equal(snap.sellable, false);
    assert.equal(snap.message, "Finalize sua conta para começar a vender.");
    assert.equal(snap.checklist.cadastral, true);
    assert.equal(snap.checklist.mercadoPago, false);
  });

  it("ACTIVE só com cadastro, docs, MP CONNECTED e aprovação", () => {
    const snap = evaluatePartnerOnboarding({
      accountStatus: "ACTIVE",
      verificationStatus: "APPROVED",
      approvedAt: new Date("2026-01-01"),
      businessName: "Pet Shop Central",
      legalName: "Pet Shop Central LTDA",
      category: "PETSHOP",
      address: "Rua A",
      city: "João Pessoa",
      description: "Loja",
      financialDetails: { pixKey: "a@b.com", pixKeyType: "E-mail" },
      verificationDocuments: [{ type: "CNPJ_CARD" }],
      mpStatus: "CONNECTED",
      mpUserId: "123456",
    });
    assert.equal(snap.status, "ACTIVE");
    assert.equal(snap.sellable, true);
    assert.equal(snap.checklist.approved, true);
    assert.equal(snap.checklist.mercadoPago, true);
  });

  it("parceiro aprovado sem MP fica PENDING_MERCADO_PAGO e não vende", () => {
    const snap = evaluatePartnerOnboarding({
      accountStatus: "ACTIVE",
      verificationStatus: "APPROVED",
      approvedAt: new Date("2026-01-01"),
      businessName: "Pet Shop Central",
      legalName: "Pet Shop Central LTDA",
      category: "PETSHOP",
      address: "Rua A",
      city: "João Pessoa",
      description: "Loja",
      financialDetails: { bankName: "Banco do Brasil", agency: "1234", accountNumber: "999", accountHolder: "Loja" },
      verificationDocuments: [{ type: "CNPJ_CARD" }],
      mpStatus: "NOT_CONNECTED",
    });
    assert.equal(snap.status, "PENDING_MERCADO_PAGO");
    assert.equal(snap.sellable, false);
    assert.equal(snap.checklist.banking, true);
    assert.equal(hasBankingDetails({ pixKey: "x", pixKeyType: "CPF" }), true);
  });

  it("mascara dados bancários e não expõe senha", () => {
    const masked = maskFinancialDetails({
      pixKey: "12345678901",
      agency: "1234",
      accountNumber: "987654",
      accountHolder: "Maria",
    });
    assert.equal(masked.accountHolder, "Maria");
    assert.ok(masked.pixKey?.includes("*"));
    assert.equal(masked.pixKey?.includes("12345678901"), false);
    assert.ok(SELLER_NOT_ENABLED_MESSAGE.includes("não está habilitado"));
  });
});
