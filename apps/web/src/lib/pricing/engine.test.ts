import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { officialActiveVersion, CATALOG_COUNTS, getCatalogBySku, OFFICIAL_CATALOG } from "./catalog";
import { quotePricing, quoteProductOrder, PricingError } from "./engine";
import type { ResolvedPricingVersion } from "./types";

function version(overrides: Partial<ResolvedPricingVersion> = {}): ResolvedPricingVersion {
  return { ...officialActiveVersion(), ...overrides };
}

describe("pricing engine — official formulas", () => {
  it("product R$ 120 → 10% + 1.49 exact cents", () => {
    const q = quotePricing({
      kind: "PRODUCT",
      baseAmountCents: 12000,
      version: version(),
      partnerVerified: true,
    });
    assert.equal(q.eccopetCommissionCents, 1200);
    assert.equal(q.fixedFeeCents, 149);
    assert.equal(q.eccopetRevenueCents, 1349);
    assert.equal(q.reserveCents, 180);
    assert.equal(q.estimatedPspCents, 409);
    assert.equal(q.partnerEconomicAmountCents, 10651);
    assert.equal(q.estimatedPayoutAfterReleaseCents, 10242);
    assert.equal(q.estimatedPayoutCents, 10062);
    assert.equal(q.customerAmountCents, 12000);
    assert.equal(q.pricingVersion, "BR-2026.08-v1");
    assert.equal(q.labels.payout, "Estimativa");
  });

  it("small product cannot produce negative payout", () => {
    assert.throws(
      () =>
        quotePricing({
          kind: "PRODUCT",
          baseAmountCents: 200,
          version: version(),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "NEGATIVE_PAYOUT"
    );
  });

  it("service base R$ 70 → 12% + 4.90", () => {
    const q = quotePricing({
      kind: "SERVICE",
      baseAmountCents: 7000,
      version: version(),
    });
    assert.equal(q.eccopetCommissionCents, 840);
    assert.equal(q.bookingFeeCents, 490);
    assert.equal(q.urgentFeeCents, 0);
    assert.equal(q.eccopetRevenueCents, 1330);
    assert.equal(q.customerAmountCents, 7490);
    assert.equal(q.reserveCents, 105);
  });

  it("urgent fee only when eligible", () => {
    const q = quotePricing({
      kind: "SERVICE",
      baseAmountCents: 7000,
      urgent: true,
      urgentEligible: true,
      version: version(),
    });
    assert.equal(q.urgentFeeCents, 1490);
    assert.equal(q.customerAmountCents, 8980);
    assert.throws(
      () =>
        quotePricing({
          kind: "SERVICE",
          baseAmountCents: 7000,
          urgent: true,
          urgentEligible: false,
          version: version(),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "URGENT_NOT_ELIGIBLE"
    );
  });

  it("coupon is applied server-side", () => {
    const q = quotePricing({
      kind: "PRODUCT",
      baseAmountCents: 12000,
      coupon: { code: "ECOPET10", discountType: "PERCENT", discountValue: 10, fundedBy: "SELLER" },
      version: version(),
    });
    assert.equal(q.discountCents, 1200);
    assert.equal(q.customerAmountCents, 10800);
    assert.equal(q.couponCode, "ECOPET10");
  });

  it("promotion outside window is rejected", () => {
    assert.throws(
      () =>
        quotePricing({
          kind: "PRODUCT",
          baseAmountCents: 12000,
          promotion: {
            name: "old",
            scope: "PRODUCT",
            fundedBy: "ECCOPET",
            validFrom: "2020-01-01T00:00:00Z",
            validTo: "2020-02-01T00:00:00Z",
            discountType: "PERCENT",
            discountValue: 10,
            status: "ACTIVE",
          },
          version: version(),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "PROMOTION_INACTIVE"
    );
  });

  it("partner override applies when approved and within floor", () => {
    const q = quotePricing({
      kind: "PRODUCT",
      baseAmountCents: 12000,
      contractOverride: {
        partnerId: "p1",
        commissionPercentBps: 800,
        validFrom: "2026-01-01T00:00:00Z",
        validTo: "2027-01-01T00:00:00Z",
        reason: "piloto",
        approvedByAdminId: "admin-1",
        approvedAt: "2026-08-01T00:00:00Z",
        floorPercentBps: 800,
      },
      version: version(),
    });
    assert.equal(q.commissionPercentBps, 800);
    assert.equal(q.eccopetCommissionCents, 960);
  });

  it("override below floor without approval is rejected", () => {
    assert.throws(
      () =>
        quotePricing({
          kind: "PRODUCT",
          baseAmountCents: 12000,
          contractOverride: {
            partnerId: "p1",
            commissionPercentBps: 500,
            validFrom: "2026-01-01T00:00:00Z",
            validTo: "2027-01-01T00:00:00Z",
            reason: " trop aggressive",
            floorPercentBps: 800,
            approvalRequired: true,
          },
          version: version(),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "OVERRIDE_APPROVAL_REQUIRED"
    );
  });

  it("EccoPet-funded discount that violates SaaS floor is refused", () => {
    assert.throws(
      () =>
        quotePricing({
          kind: "AI",
          baseAmountCents: 11990,
          catalogItem: getCatalogBySku("AI-P01") ?? undefined,
          coupon: { code: "HEAVY", discountType: "PERCENT", discountValue: 90, fundedBy: "ECCOPET", marginFloorBps: 6000 },
          version: version(),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "MARGIN_FLOOR"
    );
  });

  it("historical snapshot stays on v1 after v2 exists", () => {
    const v1 = quotePricing({ kind: "PRODUCT", baseAmountCents: 12000, version: version() });
    const v2 = quotePricing({
      kind: "PRODUCT",
      baseAmountCents: 12000,
      version: version({
        version: "BR-2026.09-v2",
        rules: { ...version().rules, productCommissionPercentBps: 1200 },
      }),
    });
    assert.equal(v1.pricingVersion, "BR-2026.08-v1");
    assert.equal(v1.eccopetCommissionCents, 1200);
    assert.equal(v2.pricingVersion, "BR-2026.09-v2");
    assert.equal(v2.eccopetCommissionCents, 1440);
  });

  it("currency is BRL", () => {
    const q = quotePricing({ kind: "PRODUCT", baseAmountCents: 12000, version: version() });
    assert.equal(q.currency, "BRL");
    assert.throws(
      () => quotePricing({ kind: "PRODUCT", baseAmountCents: 12000, currency: "USD", version: version() }),
      (e: unknown) => e instanceof PricingError && e.code === "INVALID_CURRENCY"
    );
  });

  it("DRAFT version cannot be used in checkout", () => {
    assert.throws(
      () => quotePricing({ kind: "PRODUCT", baseAmountCents: 12000, version: version({ status: "DRAFT" }) }),
      (e: unknown) => e instanceof PricingError && e.code === "VERSION_NOT_ACTIVE"
    );
  });

  it("unverified partner can quote but is not purchasable for payout", () => {
    const q = quotePricing({
      kind: "PRODUCT",
      baseAmountCents: 12000,
      partnerVerified: false,
      version: version(),
    });
    assert.equal(q.purchasable, false);
    assert.ok(q.blockedReasons.includes("PARTNER_NOT_VERIFIED"));
  });

  it("rounding stays in integer cents", () => {
    const q = quotePricing({ kind: "PRODUCT", baseAmountCents: 1990, version: version() });
    assert.equal(Number.isInteger(q.eccopetCommissionCents), true);
    assert.equal(Number.isInteger(q.estimatedPayoutCents), true);
    assert.equal(q.customerAmountCents, 1990);
  });

  it("zero price only when explicitly free", () => {
    assert.throws(
      () => quotePricing({ kind: "PRODUCT", baseAmountCents: 0, version: version() }),
      (e: unknown) => e instanceof PricingError && e.code === "ZERO_PRICE_NOT_ALLOWED"
    );
    const free = quotePricing({
      kind: "SUBSCRIPTION",
      baseAmountCents: 0,
      allowZero: true,
      version: version(),
    });
    assert.equal(free.customerAmountCents, 0);
  });

  it("order fixed fee applies once", () => {
    const { order, lines } = quoteProductOrder({
      version: version(),
      lines: [
        { unitPriceCents: 5000, quantity: 1 },
        { unitPriceCents: 5000, quantity: 1 },
      ],
    });
    assert.equal(order.fixedFeeCents, 149);
    assert.equal(lines.reduce((s, l) => s + l.fixedFeeCents, 0), 149);
    assert.equal(order.eccopetCommissionCents, 1000);
  });

  it("expired version cannot be used", () => {
    assert.throws(
      () =>
        quotePricing({
          kind: "PRODUCT",
          baseAmountCents: 12000,
          pricingDate: new Date("2024-01-01T00:00:00Z"),
          version: version({ validFrom: "2026-08-15T00:00:00-03:00" }),
        }),
      (e: unknown) => e instanceof PricingError && e.code === "VERSION_NOT_IN_FORCE"
    );
  });
});

describe("pricing catalog integrity", () => {
  it("contains every official SKU family with documented counts", () => {
    assert.equal(CATALOG_COUNTS.MKT, 27);
    assert.equal(CATALOG_COUNTS.SRV, 24);
    assert.equal(CATALOG_COUNTS.SAU, 57);
    assert.equal(CATALOG_COUNTS.ONE, 10);
    assert.equal(CATALOG_COUNTS.PRO, 10);
    assert.equal(CATALOG_COUNTS.AI, 46);
    assert.equal(CATALOG_COUNTS.ADS, 19);
    assert.equal(CATALOG_COUNTS.PRT, 10);
    assert.equal(CATALOG_COUNTS.IOT, 10);
    assert.equal(CATALOG_COUNTS.API, 4);
    assert.equal(CATALOG_COUNTS.TOTAL, 217);
  });

  it("has unique SKUs and source traceability", () => {
    const skus = OFFICIAL_CATALOG.map((i) => i.sku);
    assert.equal(new Set(skus).size, skus.length);
    for (const item of OFFICIAL_CATALOG) {
      assert.ok(item.sourceDocument.includes("Planejamento Financeiro"));
      assert.ok(item.sourceSku);
      assert.ok(item.sourceSection);
      if (item.rangeMinCents != null && item.rangeMaxCents != null) {
        assert.ok(item.rangeMinCents <= item.rangeMaxCents, item.sku);
      }
    }
  });

  it("contains sequential official SKUs without omission", () => {
    const pad = (n: number) => String(n).padStart(3, "0");
    for (let i = 1; i <= 27; i++) assert.ok(getCatalogBySku(`MKT-${pad(i)}`), `MKT-${pad(i)}`);
    for (let i = 1; i <= 24; i++) assert.ok(getCatalogBySku(`SRV-${pad(i)}`), `SRV-${pad(i)}`);
    for (let i = 1; i <= 57; i++) assert.ok(getCatalogBySku(`SAU-${pad(i)}`), `SAU-${pad(i)}`);
    for (const sku of ["ONE-000", "ONE-001", "ONE-002", "ONE-003", "ONE-004", "ONE-010", "ONE-011", "ONE-012", "ONE-013", "ONE-014"]) {
      assert.ok(getCatalogBySku(sku), sku);
    }
    for (const sku of ["PRO-001", "PRO-002", "PRO-003", "PRO-004", "PRO-010", "PRO-011", "PRO-012", "PRO-013", "PRO-014", "PRO-015"]) {
      assert.ok(getCatalogBySku(sku), sku);
    }
    for (let i = 1; i <= 14; i++) assert.ok(getCatalogBySku(`AI-T${String(i).padStart(2, "0")}`), `AI-T${String(i).padStart(2, "0")}`);
    for (let i = 1; i <= 14; i++) assert.ok(getCatalogBySku(`AI-P${String(i).padStart(2, "0")}`), `AI-P${String(i).padStart(2, "0")}`);
    for (let i = 1; i <= 5; i++) assert.ok(getCatalogBySku(`AI-C${String(i).padStart(2, "0")}`), `AI-C${String(i).padStart(2, "0")}`);
    for (let i = 1; i <= 19; i++) assert.ok(getCatalogBySku(`ADS-${pad(i)}`), `ADS-${pad(i)}`);
    for (let i = 1; i <= 10; i++) assert.ok(getCatalogBySku(`PRT-${pad(i)}`), `PRT-${pad(i)}`);
    for (let i = 1; i <= 10; i++) assert.ok(getCatalogBySku(`IOT-${pad(i)}`), `IOT-${pad(i)}`);
    for (let i = 1; i <= 4; i++) assert.ok(getCatalogBySku(`API-${pad(i)}`), `API-${pad(i)}`);
  });
});
