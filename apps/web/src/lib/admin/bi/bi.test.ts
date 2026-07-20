import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BI_DOMAINS, isBiDomain, resolveBiDomain, BI_DOMAIN_META } from "./domains";
import { resolveBiDateRange, BI_PERIOD_OPTIONS } from "./periods";
import { canAccessBi } from "./permissions";
import { buildBiExportPayload } from "./export-service";
import { getGaDataApiConfig } from "./ga-data-client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";

describe("bi domains", () => {
  it("lista módulos do Centro de Inteligência", () => {
    assert.ok(BI_DOMAINS.includes("executive"));
    assert.ok(BI_DOMAINS.includes("google-analytics"));
    assert.ok(BI_DOMAINS.includes("marketplace"));
    assert.equal(isBiDomain("marketplace"), true);
    assert.equal(isBiDomain("foo"), false);
    assert.equal(resolveBiDomain("social"), "social");
    assert.equal(resolveBiDomain("x"), "executive");
    assert.equal(BI_DOMAIN_META.length, BI_DOMAINS.length);
  });
});

describe("bi periods", () => {
  const now = new Date("2026-07-19T15:00:00.000Z");

  it("resolve 30d / 7d / today", () => {
    const d30 = resolveBiDateRange({ period: "30d", now });
    assert.equal(d30.preset, "30d");
    assert.ok(d30.from < d30.to);
    assert.ok(d30.previousFrom < d30.previousTo);

    const d7 = resolveBiDateRange({ period: "7d", now });
    assert.equal(d7.label, "Últimos 7 dias");

    const today = resolveBiDateRange({ period: "today", now });
    assert.equal(today.preset, "today");
  });

  it("custom range", () => {
    const r = resolveBiDateRange({
      period: "custom",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-10",
      now,
    });
    assert.equal(r.preset, "custom");
    assert.ok(r.label.includes("2026-07-01"));
  });

  it("period options cobrem comparativos pedidos", () => {
    const values = BI_PERIOD_OPTIONS.map((o) => o.value);
    for (const v of ["today", "yesterday", "7d", "30d", "90d", "year", "custom"] as const) {
      assert.ok(values.includes(v));
    }
  });
});

describe("bi permissions", () => {
  it("somente ADMIN", () => {
    assert.equal(canAccessBi("ADMIN"), true);
    assert.equal(canAccessBi("CLIENT"), false);
    assert.equal(canAccessBi("PARTNER"), false);
  });
});

describe("bi export", () => {
  const sample: ErpModuleResponse = {
    moduleId: "bi-executive",
    title: "Dashboard",
    period: "Últimos 30 dias",
    kpis: [
      { key: "revenue", label: "Receita", value: 100 },
      { key: "email", label: "Email", value: "should-strip-key" },
    ],
    tables: [
      {
        id: "t",
        label: "T",
        rows: [
          { product: "Ração", revenue: 50, email: "a@b.com", token: "secret" },
          { product: "Coleira", revenue: 20 },
        ],
      },
    ],
  };

  it("CSV sanitiza PII/secrets", () => {
    const out = buildBiExportPayload(sample, "csv");
    assert.equal(out.contentType.includes("csv"), true);
    assert.ok(!out.body.includes("a@b.com"));
    assert.ok(!out.body.includes("secret"));
    assert.ok(out.body.includes("Ração") || out.body.includes("Coleira"));
  });

  it("JSON e Excel e PDF", () => {
    const json = buildBiExportPayload(sample, "json");
    assert.ok(json.filename.endsWith(".json"));
    const excel = buildBiExportPayload(sample, "excel");
    assert.ok(excel.filename.endsWith(".xls"));
    const pdf = buildBiExportPayload(sample, "pdf");
    assert.ok(pdf.contentType.includes("html"));
    assert.ok(pdf.body.includes("EcoPet BI"));
  });
});

describe("ga data api config", () => {
  it("sem credenciais fica NOT_CONFIGURED (não quebra)", () => {
    const prevProp = process.env.GA4_PROPERTY_ID;
    const prevJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
    delete process.env.GA4_PROPERTY_ID;
    delete process.env.GA4_SERVICE_ACCOUNT_JSON;
    try {
      const cfg = getGaDataApiConfig();
      assert.equal(cfg.configured, false);
      assert.equal(cfg.hasCredentials, false);
    } finally {
      if (prevProp !== undefined) process.env.GA4_PROPERTY_ID = prevProp;
      if (prevJson !== undefined) process.env.GA4_SERVICE_ACCOUNT_JSON = prevJson;
    }
  });
});
