import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateStrongPassword } from "./validate-strong-password";

const arthurCtx = {
  email: "arthur@gmail.com",
  name: "Arthur Silva",
  username: "arthur_silva",
};

describe("validateStrongPassword — e-mail e caractere @", () => {
  it("aceita senha com @ quando não contém dados pessoais do e-mail", () => {
    const r = validateStrongPassword("EcoPet@2026", {
      email: "test@test.com",
      name: "Test User",
    });
    assert.equal(r.valid, true);
  });

  it("neves@12b recusa apenas por falta de maiúscula", () => {
    const r = validateStrongPassword("neves@12b", {
      email: "other@gmail.com",
      name: "Other Person",
    });
    assert.equal(r.valid, false);
    assert.match(r.error ?? "", /maiúscula/i);
  });

  it("neves@12b não é recusada como e-mail com e-mail diferente", () => {
    const r = validateStrongPassword("neves@12b", {
      email: "other@gmail.com",
      name: "Other Person",
    });
    assert.ok(!/(e-mail|email)/i.test(r.error ?? ""), `erro inesperado: ${r.error}`);
  });

  it("recusa senha contendo e-mail completo", () => {
    const r = validateStrongPassword("arthur@gmail.com123A!", arthurCtx);
    assert.equal(r.valid, false);
    assert.match(r.error ?? "", /e-mail/i);
  });

  it("recusa senha contendo parte local do e-mail", () => {
    const r = validateStrongPassword("arthur123A!", arthurCtx);
    assert.equal(r.valid, false);
    assert.match(r.error ?? "", /e-mail/i);
  });

  it("gmail@123A não é recusada como e-mail", () => {
    const r = validateStrongPassword("gmail@123A", arthurCtx);
    assert.equal(r.valid, true);
  });

  it("recusa senha contendo domínio do e-mail", () => {
    const r = validateStrongPassword("gmail.com123A!", arthurCtx);
    assert.equal(r.valid, false);
    assert.match(r.error ?? "", /e-mail/i);
  });

  it("ignora e-mail incompleto no contexto (evita falso positivo com @)", () => {
    const r = validateStrongPassword("neves@12b", {
      email: "neves@12b",
      name: "Other Person",
    });
    assert.equal(r.valid, false);
    assert.match(r.error ?? "", /maiúscula/i);
    assert.ok(!/(e-mail|email)/i.test(r.error ?? ""), `erro inesperado: ${r.error}`);
  });

  it("@ conta como caractere especial", () => {
    const r = validateStrongPassword("EcoPet@2026", { email: "x@y.com", name: "X" });
    const special = r.requirements.find((req) => req.id === "special");
    assert.equal(special?.met, true);
  });
});
