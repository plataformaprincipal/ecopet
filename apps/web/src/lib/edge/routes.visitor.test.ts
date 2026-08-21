import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPublicSocialPath,
  isPublicPath,
  requiresAuth,
  AUTH_REQUIRED_EXACT,
} from "@/lib/edge/routes";

describe("visitor public routes", () => {
  it("exposes /social as public read path", () => {
    assert.equal(isPublicSocialPath("/social"), true);
    assert.equal(isPublicPath("/social"), true);
    assert.equal(requiresAuth("/social"), false);
    assert.equal(AUTH_REQUIRED_EXACT.has("/social"), false);
  });

  it("keeps private account routes protected", () => {
    assert.equal(requiresAuth("/perfil"), true);
    assert.equal(requiresAuth("/meu-pet"), true);
    assert.equal(requiresAuth("/pedidos"), true);
    assert.equal(requiresAuth("/checkout"), true);
    assert.equal(requiresAuth("/cadastro/google"), false);
  });

  it("keeps marketplace browse and cart public, checkout private via marketplace rules", () => {
    assert.equal(requiresAuth("/marketplace"), false);
    assert.equal(requiresAuth("/marketplace/parceiros"), false);
    assert.equal(requiresAuth("/carrinho"), false);
    assert.equal(requiresAuth("/adocao"), false);
    assert.equal(requiresAuth("/explorar"), false);
    assert.equal(requiresAuth("/servicos"), false);
    assert.equal(requiresAuth("/ngos"), false);
  });

  it("exposes EccoPet AI catalog publicly and protects checkout/session", () => {
    assert.equal(requiresAuth("/eccopet"), false);
    assert.equal(requiresAuth("/eccopet/triagem"), false);
    assert.equal(requiresAuth("/eccopet/health-profile"), false);
    assert.equal(requiresAuth("/eccopet/checkout"), true);
    assert.equal(requiresAuth("/minha-conta/ia"), true);
  });
});
