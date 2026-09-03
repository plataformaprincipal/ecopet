import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COMMERCIAL_PRODUCTS, ENTERTAINMENT_SKU, familyOfSku, publicStatus } from "./products";
import { refundPolicyForSku } from "./refund-policy";
import { getCatalogBySku, CATALOG_COUNTS } from "@/lib/pricing/catalog";
import { quotePricing } from "@/lib/pricing/engine";
import { officialActiveVersion } from "@/lib/pricing/catalog";
import { buildIdentifiedPdf } from "./identified-pdf";

describe("commerce catalog PFO", () => {
  it("keeps official SKU counts", () => {
    assert.equal(CATALOG_COUNTS.MKT, 27);
    assert.equal(CATALOG_COUNTS.SRV, 24);
    assert.equal(CATALOG_COUNTS.SAU, 57);
    assert.equal(CATALOG_COUNTS.ONE, 10);
    assert.equal(CATALOG_COUNTS.PRO, 10);
    assert.equal(CATALOG_COUNTS.ADS, 19);
    assert.equal(CATALOG_COUNTS.PRT, 10);
    assert.equal(CATALOG_COUNTS.IOT, 10);
    assert.equal(CATALOG_COUNTS.API, 4);
  });

  it("does not invent entertainment price", () => {
    assert.equal(getCatalogBySku(ENTERTAINMENT_SKU), undefined);
    const product = COMMERCIAL_PRODUCTS.find((p) => p.sku === ENTERTAINMENT_SKU);
    assert.ok(product);
    assert.equal(publicStatus(undefined, ENTERTAINMENT_SKU), "PRICE_PENDING");
  });

  it("ONE/PRO are purchasable at official prices", () => {
    const plus = getCatalogBySku("ONE-001")!;
    assert.equal(plus.amountCents, 1990);
    assert.equal(plus.annualAmountCents, 19900);
    assert.equal(plus.commercialAvailability, "PURCHASABLE");
    const starter = getCatalogBySku("PRO-001")!;
    assert.equal(starter.amountCents, 8990);
    assert.equal(starter.setupAmountCents, 24900);
    assert.equal(starter.commercialAvailability, "PURCHASABLE");
  });

  it("teleconsulta stays PARTNER_REQUIRED until licensed partner", () => {
    const tele = getCatalogBySku("SAU-008")!;
    assert.equal(tele.referenceTutorCents, 12990);
    assert.equal(tele.commercialAvailability, "PARTNER_REQUIRED");
    const q = quotePricing({
      kind: "HEALTH",
      sku: "SAU-008",
      baseAmountCents: tele.referenceTutorCents!,
      quantity: 1,
      version: officialActiveVersion(),
      catalogItem: tele,
    });
    assert.equal(q.purchasable, false);
  });

  it("insurance is PARTNER_REQUIRED and not EccoPet risk", () => {
    for (const sku of ["PRT-001", "PRT-004", "PRT-010"]) {
      const item = getCatalogBySku(sku)!;
      assert.equal(item.commercialAvailability, "PARTNER_REQUIRED");
      assert.equal(item.revenueRecognition, "PREMIUM_NOT_REVENUE");
    }
  });

  it("maps families and refund floors", () => {
    assert.equal(familyOfSku("SAU-008"), "TELEHEALTH");
    assert.equal(familyOfSku("ONE-001"), "ONE");
    assert.equal(refundPolicyForSku("SAU-008").payoutDays, 7);
    assert.equal(refundPolicyForSku("MKT-001").payoutDays, 14);
  });

  it("ignores frontend price by quoting server catalog", () => {
    const item = getCatalogBySku("ONE-001")!;
    const q = quotePricing({
      kind: "SUBSCRIPTION",
      sku: "ONE-001",
      baseAmountCents: item.amountCents!,
      quantity: 1,
      version: officialActiveVersion(),
      catalogItem: item,
    });
    assert.equal(q.customerAmountCents, 1990);
    assert.equal(q.purchasable, true);
    assert.notEqual(q.customerAmountCents, 1);
  });

  it("builds identified PDF that is not an AI diagnosis", () => {
    const pdf = buildIdentifiedPdf({
      title: "Laudo",
      crmv: "CRMV-SP 123",
      professionalName: "Dra Teste",
      caseId: "case1",
      sku: "SAU-008",
      notes: "Documento profissional.",
    });
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.match(pdf.toString("latin1"), /IA nao emite/);
  });

  it("AI-T/P/C use OpenAI capabilities except human radiology review", () => {
    const t09 = getCatalogBySku("AI-T09")!;
    assert.equal(t09.capabilityId, "pfo.emergency_assistant");
    assert.equal(t09.commercialAvailability, "PURCHASABLE");
    const q = quotePricing({
      kind: "AI",
      sku: "AI-T09",
      baseAmountCents: t09.amountCents!,
      quantity: 1,
      version: officialActiveVersion(),
      catalogItem: t09,
    });
    assert.equal(q.purchasable, true);
    const c05 = getCatalogBySku("AI-C05")!;
    assert.equal(c05.commercialAvailability, "PARTNER_REQUIRED");
    const blocked = quotePricing({
      kind: "AI",
      sku: "AI-C05",
      baseAmountCents: c05.amountCents!,
      quantity: 1,
      version: officialActiveVersion(),
      catalogItem: c05,
    });
    assert.equal(blocked.purchasable, false);
  });
});
