import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLgpdChecklist } from "./lgpd-checklist";
import { getSecurityAuditChecks } from "./security-audit";
import { getSeoAuditChecks } from "./seo-audit";
import { getGtmProductionChecks } from "./gtm-production-audit";
import { getSupabaseInfrastructureChecks } from "./supabase-audit";
import { contentSecurityPolicy } from "@/lib/security/headers";

describe("production readiness checklists", () => {
  it("LGPD checklist cobre sanitize e consent", () => {
    const ids = getLgpdChecklist().map((c) => c.id);
    assert.ok(ids.includes("lgpd-analytics-sanitize"));
    assert.ok(ids.includes("lgpd-gtm-sanitize"));
    assert.ok(ids.includes("lgpd-consent-banner"));
  });

  it("security audit exige Mercado Pago e GTM no CSP", () => {
    const csp = contentSecurityPolicy();
    assert.ok(csp.includes("sdk.mercadopago.com"));
    assert.ok(csp.includes("googletagmanager.com"));
    const mp = getSecurityAuditChecks().find((c) => c.id === "sec-csp-mp");
    const ga = getSecurityAuditChecks().find((c) => c.id === "sec-csp-ga");
    assert.equal(mp?.status, "PASS");
    assert.equal(ga?.status, "PASS");
  });

  it("SEO checklist inclui robots e sitemap", () => {
    const ids = getSeoAuditChecks().map((c) => c.id);
    assert.ok(ids.includes("seo-robots"));
    assert.ok(ids.includes("seo-sitemap"));
  });

  it("GTM production checks incluem Preview MANUAL e Estratégia B", () => {
    const checks = getGtmProductionChecks();
    const ids = checks.map((c) => c.id);
    assert.ok(ids.includes("gtm-strategy-b"));
    assert.ok(ids.includes("gtm-preview"));
    assert.equal(checks.find((c) => c.id === "gtm-preview")?.status, "MANUAL");
    assert.equal(checks.find((c) => c.id === "gtm-strategy-b")?.status, "PASS");
  });

  it("Supabase checks: PITR off e backups MANUAL", () => {
    const checks = getSupabaseInfrastructureChecks();
    const pitr = checks.find((c) => c.id === "db-pitr");
    const backup = checks.find((c) => c.id === "db-backup-daily");
    assert.equal(pitr?.status, "N/A");
    assert.equal(backup?.status, "MANUAL");
    assert.ok(checks.some((c) => c.id === "db-migrations-policy"));
  });
});
