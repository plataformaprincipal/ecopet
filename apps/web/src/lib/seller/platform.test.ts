import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ECCOPET_SELLER_ID } from "@/lib/cart/universal";
import {
  cartSellerIdentity,
  isExternalMarketplaceRole,
  isPlatformSellerId,
  requiresExternalSellerGate,
} from "./platform";

describe("seller gate — EccoPet own vs parceiro externo", () => {
  it("ECCOPET OWN SELLER: plataforma / ADMIN / id nulo não exigem Connect", () => {
    assert.equal(isPlatformSellerId(null), true);
    assert.equal(isPlatformSellerId(undefined), true);
    assert.equal(isPlatformSellerId(ECCOPET_SELLER_ID), true);
    assert.equal(requiresExternalSellerGate({ sellerId: null }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: ECCOPET_SELLER_ID }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: "admin-user-id", role: "ADMIN" }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: "gestor-user-id", role: "GESTOR" }), false);
    assert.equal(cartSellerIdentity({ sellerId: "admin-user-id", role: "ADMIN" }).sellerType, "ECCOPET");
    assert.equal(cartSellerIdentity({ sellerId: null }).sellerId, ECCOPET_SELLER_ID);
  });

  it("AI / PLANOS / SERVIÇOS ECCOPET: SKU digital da plataforma é own seller", () => {
    assert.equal(requiresExternalSellerGate({ sellerId: ECCOPET_SELLER_ID, role: null }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: null, role: "ADMIN" }), false);
    assert.equal(isExternalMarketplaceRole("ADMIN"), false);
    assert.equal(isExternalMarketplaceRole("GESTOR"), false);
  });

  it("PARCEIRO EXTERNO CONTINUA PROTEGIDO: PARTNER/ONG e roles de marketplace exigem gate", () => {
    assert.equal(requiresExternalSellerGate({ sellerId: "partner-1", role: "PARTNER" }), true);
    assert.equal(requiresExternalSellerGate({ sellerId: "ong-1", role: "ONG" }), true);
    assert.equal(requiresExternalSellerGate({ sellerId: "clinic-1", role: "CLINIC" }), true);
    assert.equal(requiresExternalSellerGate({ sellerId: "petshop-1", role: "PETSHOP" }), true);
    assert.equal(requiresExternalSellerGate({ sellerId: "unknown-uuid" }), true);
    assert.equal(isPlatformSellerId("partner-1"), false);
    assert.equal(cartSellerIdentity({ sellerId: "ong-1", role: "ONG" }).sellerType, "ONG");
    assert.equal(cartSellerIdentity({ sellerId: "partner-1", role: "PARTNER" }).sellerType, "PARTNER");
  });
});
