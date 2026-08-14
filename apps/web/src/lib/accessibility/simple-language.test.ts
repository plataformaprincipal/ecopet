import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { simplifyText, SIMPLE_LANGUAGE_MAP } from "./simple-language";

describe("simple-language", () => {
  it("não altera texto quando desativado", () => {
    assert.equal(simplifyText("Tornar publicação privada", false), "Tornar publicação privada");
  });

  it("substitui frases do dicionário quando ativado", () => {
    assert.equal(simplifyText("Tornar publicação privada", true), SIMPLE_LANGUAGE_MAP["Tornar publicação privada"]);
    assert.equal(simplifyText("Mais perto de mim", true), "Opções próximas de você");
    assert.equal(simplifyText("Perto de mim", true), "Opções próximas de você");
    assert.equal(simplifyText("Caderneta de Vacinas", true), "Vacinas do seu pet");
    assert.equal(simplifyText("Filtros", true), "Escolher opções");
  });

  it("nunca expõe FOLLOWERS_ONLY cru", () => {
    assert.equal(simplifyText("FOLLOWERS_ONLY", true), "Somente seguidores");
    assert.equal(simplifyText("FOLLOWERS", true), "Somente seguidores");
  });

  it("mantém texto desconhecido", () => {
    assert.equal(simplifyText("Texto livre sem mapeamento", true), "Texto livre sem mapeamento");
  });
});
