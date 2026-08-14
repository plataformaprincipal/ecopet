import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBusinessTool, listBusinessTools } from "./tool-registry";

const NEW_TOOLS = [
  "consult_adoptions",
  "consult_loyalty",
  "consult_trending",
  "consult_pet_vaccinations",
  "request_client_action",
  "add_to_cart",
  "create_support_ticket",
  "prepare_appointment",
] as const;

describe("tool-registry expansion", () => {
  it("registra todas as ferramentas de domínio novas", () => {
    for (const name of NEW_TOOLS) {
      const tool = getBusinessTool(name);
      assert.ok(tool, `missing tool: ${name}`);
      assert.equal(tool!.name, name);
    }
  });

  it("marca writes com readOnly=false e consults com readOnly=true", () => {
    assert.equal(getBusinessTool("consult_adoptions")!.readOnly, true);
    assert.equal(getBusinessTool("consult_loyalty")!.readOnly, true);
    assert.equal(getBusinessTool("consult_trending")!.readOnly, true);
    assert.equal(getBusinessTool("consult_pet_vaccinations")!.readOnly, true);
    assert.equal(getBusinessTool("request_client_action")!.readOnly, false);
    assert.equal(getBusinessTool("add_to_cart")!.readOnly, false);
    assert.equal(getBusinessTool("create_support_ticket")!.readOnly, false);
    assert.equal(getBusinessTool("prepare_appointment")!.readOnly, false);
  });

  it("expõe consult_adoptions/trending/products para CLIENT e PARTNER", () => {
    const client = listBusinessTools("CLIENT").map((t) => t.name);
    const partner = listBusinessTools("PARTNER").map((t) => t.name);
    for (const name of ["consult_adoptions", "consult_trending", "consult_products"] as const) {
      assert.ok(client.includes(name), `CLIENT missing ${name}`);
      assert.ok(partner.includes(name), `PARTNER missing ${name}`);
    }
  });

  it("restringe writes de carrinho/ticket/agenda a CLIENT (não PARTNER)", () => {
    const partner = listBusinessTools("PARTNER").map((t) => t.name);
    assert.ok(!partner.includes("add_to_cart"));
    assert.ok(!partner.includes("create_support_ticket"));
    assert.ok(!partner.includes("prepare_appointment"));
    assert.ok(listBusinessTools("CLIENT").some((t) => t.name === "add_to_cart"));
  });

  it("request_client_action exige action e lista enum", () => {
    const tool = getBusinessTool("request_client_action")!;
    assert.deepEqual(tool.parameters.required, ["action"]);
    assert.ok(tool.parameters.properties.action.enum?.includes("SET_THEME"));
    assert.ok(tool.parameters.properties.action.enum?.includes("NAVIGATE"));
    assert.ok(tool.parameters.properties.action.enum?.includes("REQUEST_GEOLOCATION"));
  });
});
