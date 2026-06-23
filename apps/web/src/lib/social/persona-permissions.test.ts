import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SocialPostType } from "@prisma/client";
import {
  canCreateAdoptionPost,
  canCreateProductPost,
  canCreateServicePost,
  canCreateSocialPost,
  canInteract,
  canModerateSocial,
  canRequestAdoption,
  getAllowedPostTypes,
} from "./persona-permissions";
import type { SocialUser } from "./permissions";

function user(role: SocialUser["role"], status: SocialUser["accountStatus"] = "ACTIVE"): SocialUser {
  return { id: "u1", role, accountStatus: status, name: "Test", email: "t@test.com" };
}

describe("persona-permissions", () => {
  it("visitante não interage", () => {
    assert.equal(canInteract(null), false);
    assert.equal(canCreateSocialPost(null), false);
  });

  it("cliente cria post geral e pet update", () => {
    const c = user("CLIENT");
    assert.equal(canCreateSocialPost(c, "GENERAL"), true);
    assert.equal(canCreateSocialPost(c, "PET_UPDATE"), true);
    assert.equal(canCreateSocialPost(c, "PRODUCT"), false);
    assert.equal(canCreateAdoptionPost(c), false);
    assert.equal(canRequestAdoption(c), true);
  });

  it("parceiro cria post de produto e serviço", () => {
    const p = user("PARTNER");
    assert.equal(canCreateProductPost(p), true);
    assert.equal(canCreateServicePost(p), true);
    assert.equal(canCreateAdoptionPost(p), false);
  });

  it("ONG cria adoção e campanha", () => {
    const o = user("ONG");
    assert.equal(canCreateAdoptionPost(o), true);
    assert.equal(canCreateSocialPost(o, "CAMPAIGN"), true);
    assert.equal(canCreateProductPost(o), false);
  });

  it("admin modera e cria qualquer tipo", () => {
    const a = user("ADMIN");
    assert.equal(canModerateSocial(a), true);
    const types = getAllowedPostTypes(a);
    assert.ok(types.includes("URGENT" as SocialPostType));
  });

  it("conta suspensa não interage", () => {
    const s = user("CLIENT", "SUSPENDED");
    assert.equal(canInteract(s), false);
  });
});
