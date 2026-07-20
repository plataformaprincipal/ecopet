import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AnalyticsEvents,
  AuthEvents,
  MarketplaceEvents,
  OrderEvents,
  countCatalogEvents,
  listAllEventDefinitions,
  findEventDefinition,
  EcoPetEventCatalog,
} from "./events";
import { buildAnalyticsEvent } from "./factory";
import { isSafeEventName } from "./sanitize";
import { defineEvent } from "./events/definitions";

describe("event catalog", () => {
  it("mantém aliases GA4 do Prompt 1", () => {
    assert.equal(AnalyticsEvents.LOGIN, "login");
    assert.equal(AnalyticsEvents.PURCHASE, "purchase");
    assert.equal(AnalyticsEvents.ADD_TO_CART, "add_to_cart");
    assert.equal(AnalyticsEvents.SIGN_UP, "sign_up");
  });

  it("cobre todos os módulos pedidos", () => {
    const keys = Object.keys(EcoPetEventCatalog);
    for (const mod of [
      "auth",
      "marketplace",
      "products",
      "services",
      "appointments",
      "orders",
      "payments",
      "pets",
      "social",
      "notifications",
      "partners",
      "ngo",
      "admin",
      "chat",
      "ai",
      "profile",
      "search",
      "maps",
      "errors",
      "performance",
      "shared",
    ]) {
      assert.ok(keys.includes(mod), `missing module ${mod}`);
    }
  });

  it("todos os event_name são válidos para GA4", () => {
    const defs = listAllEventDefinitions();
    assert.ok(defs.length >= 80, `expected >= 80 events, got ${defs.length}`);
    for (const def of defs) {
      assert.equal(isSafeEventName(def.event_name), true, def.event_name);
      assert.ok(def.category);
      assert.ok(def.action);
      assert.ok(def.module);
    }
    assert.equal(countCatalogEvents(), defs.length);
  });

  it("defineEvent rejeita nome inválido", () => {
    assert.throws(() =>
      defineEvent({
        event_name: "BAD NAME",
        category: "x",
        action: "y",
        module: "z",
      })
    );
  });

  it("findEventDefinition localiza login", () => {
    const def = findEventDefinition("login");
    assert.ok(def);
    assert.equal(def!.module, "auth");
  });
});

describe("event factory", () => {
  it("enriquece com category/action/module e contexto", () => {
    const built = buildAnalyticsEvent({
      event: AuthEvents.LOGIN,
      label: "credentials",
      value: 1,
      params: { method: "credentials" },
    });
    assert.equal(built.name, "login");
    assert.equal(built.params.event_category, "auth");
    assert.equal(built.params.event_action, "login");
    assert.equal(built.params.module, "auth");
    assert.equal(built.params.event_label, "credentials");
    assert.equal(built.params.method, "credentials");
    assert.ok(built.params.anonymous_id);
    assert.ok(built.params.session_id);
    assert.ok(built.params.timestamp);
  });

  it("aceita definição de marketplace", () => {
    const built = buildAnalyticsEvent({
      event: MarketplaceEvents.ADD_TO_CART,
      params: { item_id: "p1", quantity: 2 },
    });
    assert.equal(built.name, "add_to_cart");
    assert.equal(built.params.module, "marketplace");
  });

  it("aceita OrderEvents.PURCHASE", () => {
    const built = buildAnalyticsEvent({
      event: OrderEvents.PURCHASE,
      value: 99.9,
      params: { currency: "BRL", order_id: "ord_1" },
    });
    assert.equal(built.name, "purchase");
    assert.equal(built.params.value, 99.9);
  });
});

describe("LGPD sanitize nos params de evento", () => {
  it("factory pode incluir campos que sanitize remove depois", async () => {
    const { sanitizeEventParams } = await import("./sanitize");
    const built = buildAnalyticsEvent({
      event: "login",
      params: {
        email: "a@b.com",
        password: "x",
        method: "credentials",
      },
    });
    const clean = sanitizeEventParams(built.params);
    assert.equal(clean.email, undefined);
    assert.equal(clean.password, undefined);
    assert.equal(clean.method, "credentials");
  });
});
