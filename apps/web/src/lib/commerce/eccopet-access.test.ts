import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLIENT_ORDER_FILTERS,
  eccopetOperationalLabel,
  isEccopetSelfFulfilledItem,
  matchesClientOrderFilter,
  orderFilterBuckets,
  resolveEccopetAccess,
  skuToRoute,
} from "./eccopet-access";
import { operationalLabel } from "./ops-policy";

describe("EccoPet self-fulfillment e mapeamento SKU → rota", () => {
  it("trata os 13 SKUs de IA como SELF_FULFILLED mesmo com partnerId", () => {
    for (const sku of [
      "AI_ECCOVET",
      "AI_ECCOVET_TRIAGE",
      "AI_ECCOVET_REPORT",
      "AI_ECCOVET_EXAMS",
      "AI_ECCOVET_VISION",
      "AI_ECCONUTRI",
      "AI_ECCOPESO",
      "AI_ECCODENTAL",
      "AI_ECCOBEHAVIOR",
      "AI_ECCOVACCINE",
      "AI_ECCOMED",
      "AI_ECCOCHECKUP",
      "AI_PET_HEALTH_PROFILE",
    ]) {
      assert.equal(
        isEccopetSelfFulfilledItem({ sku, itemType: "DIGITAL_AI", partnerId: "seller-xyz" }),
        true,
        sku
      );
    }
  });

  it("mapeia SKU canônico para a rota já existente", () => {
    assert.equal(skuToRoute("AI_ECCOVET"), "/eccopet/vet");
    assert.equal(skuToRoute("AI_ECCOVET_EXAMS"), "/eccopet/exames");
    assert.equal(skuToRoute("AI_ECCOCHECKUP"), "/eccopet/checkup");
    assert.equal(skuToRoute("AI_PET_HEALTH_PROFILE"), "/eccopet/health-profile");
    assert.equal(skuToRoute("ONE-001"), "/assinatura");
    assert.equal(skuToRoute("PRO-003"), "/partner/planos");
    assert.equal(resolveEccopetAccess("AI_ECCOVET_EXAMS")?.ctaLabel, "Analisar exames");
    assert.equal(resolveEccopetAccess("AI_ECCOVET")?.ctaLabel, "Usar EccoVet");
    assert.equal(resolveEccopetAccess("ONE-001")?.ctaLabel, "Acessar meu plano");
    assert.equal(resolveEccopetAccess("PRO-003")?.ctaLabel, "Acessar meu plano");
  });

  it("não espera parceiro em item EccoPet pago", () => {
    assert.equal(
      eccopetOperationalLabel({
        paid: true,
        selfFulfilled: true,
        digital: true,
        orderStatus: "PAID",
      }),
      "Pagamento aprovado · acesso liberado"
    );
    assert.equal(operationalLabel("PAID", "digital", "platform"), "Pagamento aprovado · acesso liberado");
    assert.equal(operationalLabel("PAID"), "Pagamento aprovado · aguardando o parceiro");
    assert.equal(
      eccopetOperationalLabel({
        paid: true,
        selfFulfilled: false,
        digital: false,
        orderStatus: "PAID",
      }),
      "Pagamento aprovado · aguardando confirmação do parceiro"
    );
  });

  it("separa pedido misto: EccoPet libera e parceiro aguarda", () => {
    const buckets = orderFilterBuckets({
      status: "PAID",
      paid: true,
      items: [
        { selfFulfilled: true, accessAvailable: true },
        { selfFulfilled: false, accessAvailable: false },
      ],
    });
    assert.equal(matchesClientOrderFilter(buckets, "access_available"), true);
    assert.equal(matchesClientOrderFilter(buckets, "awaiting_partner"), true);
    assert.ok(CLIENT_ORDER_FILTERS.some((tab) => tab.id === "access_available"));
  });

  it("teleconsulta habilitada continua exigindo parceiro", () => {
    assert.equal(
      isEccopetSelfFulfilledItem({ sku: "SAU-008", itemType: "CATALOG_SKU", partnerId: null }),
      false
    );
  });
});
