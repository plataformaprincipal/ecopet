/**
 * Testes unitários da camada backend GTM (sem warehouse de eventos).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDeduplicationKey } from "./deduplication-service";
import { getGtmEventCatalog } from "./catalog-service";
import { isTransactionalEventName, GTM_CONTRACT_VERSION } from "./types";
import { maskGtmContainerId, isValidGtmContainerId } from "@/lib/gtm/config";

describe("GTM backend — ID mask/validate", () => {
  it("valida formato GTM-XXXX", () => {
    assert.equal(isValidGtmContainerId("GTM-ABCDEF"), true);
    assert.equal(isValidGtmContainerId("GTM-XXXX"), false);
    assert.equal(isValidGtmContainerId(""), false);
  });

  it("mascara container sem expor ID completo", () => {
    const masked = maskGtmContainerId("GTM-MNOPQRML");
    assert.ok(masked);
    assert.equal(masked!.startsWith("GTM-"), true);
    assert.ok(!masked!.includes("MNOPQRML"));
    assert.ok(masked!.includes("***"));
  });
});

describe("GTM backend — dedupe key", () => {
  it("gera chave estável e sem PII em claro", () => {
    const a = buildDeduplicationKey("purchase", "order", "ord_123");
    const b = buildDeduplicationKey("purchase", "order", "ord_123");
    const c = buildDeduplicationKey("purchase", "order", "ord_999");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 32);
    assert.ok(!a.includes("ord_123"));
  });

  it("classifica eventos transacionais", () => {
    assert.equal(isTransactionalEventName("purchase"), true);
    assert.equal(isTransactionalEventName("refund"), true);
    assert.equal(isTransactionalEventName("page_view"), false);
  });
});

describe("GTM backend — catálogo", () => {
  it("pagina e filtra sem persistir ocorrências", () => {
    const page1 = getGtmEventCatalog({ page: 1, pageSize: 5 });
    assert.ok(page1.total > 0);
    assert.equal(page1.items.length, Math.min(5, page1.total));
    assert.equal(page1.contractVersion, GTM_CONTRACT_VERSION);

    const tx = getGtmEventCatalog({ transactional: true, pageSize: 50 });
    assert.ok(tx.items.every((r) => r.transactional && r.deduplicationRequired));

    const purchase = getGtmEventCatalog({ q: "purchase", pageSize: 20 });
    assert.ok(purchase.items.some((r) => r.name === "purchase"));
  });
});
