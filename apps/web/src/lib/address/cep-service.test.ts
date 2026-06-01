import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCep,
  formatCepDisplay,
  isValidCepFormat,
  parseViaCepResponse,
  getCachedCep,
  setCachedCep,
} from "./cep-service";

describe("cep-service", () => {
  it("normalizeCep remove caracteres especiais", () => {
    assert.equal(normalizeCep("58000-000"), "58000000");
    assert.equal(normalizeCep("58.000.000"), "58000000");
  });

  it("formatCepDisplay aplica máscara", () => {
    assert.equal(formatCepDisplay("58000000"), "58000-000");
  });

  it("isValidCepFormat exige 8 dígitos", () => {
    assert.equal(isValidCepFormat("58000000"), true);
    assert.equal(isValidCepFormat("5800"), false);
    assert.equal(isValidCepFormat("5800000a"), false);
  });

  it("parseViaCepResponse mapeia campos", () => {
    const parsed = parseViaCepResponse({
      cep: "58000-000",
      logradouro: "Rua Teste",
      bairro: "Centro",
      localidade: "João Pessoa",
      uf: "PB",
      complemento: "Sala 1",
    });
    assert.ok(parsed);
    assert.equal(parsed!.street, "Rua Teste");
    assert.equal(parsed!.city, "João Pessoa");
    assert.equal(parsed!.state, "PB");
    assert.equal(parsed!.district, "Centro");
  });

  it("parseViaCepResponse retorna null para CEP inexistente", () => {
    assert.equal(parseViaCepResponse({ erro: true }), null);
  });

  it("cache local armazena e recupera CEP", () => {
    setCachedCep("58000000", { street: "Rua Cache", city: "JP", state: "PB" });
    const cached = getCachedCep("58000-000");
    assert.ok(cached);
    assert.equal(cached!.street, "Rua Cache");
  });
});
