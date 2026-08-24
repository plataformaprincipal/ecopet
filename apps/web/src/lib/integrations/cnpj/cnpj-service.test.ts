import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { lookupCnpj, parseBrasilApiCnpj, getCnpjStatusWarnings } from "./cnpj-service";
import { CNPJ_BAIXADO_MESSAGE, CNPJ_INAPTO_MESSAGE } from "./types";
import { CNPJ_LOOKUP_UNAVAILABLE_MESSAGE } from "@/schemas/validation/documents-shared";

const NUMERIC_VALID = "11444777000161";
const RFB_ALNUM = "12ABC34501DE35";

describe("cnpj-service", () => {
  it("parseBrasilApiCnpj mapeia razão social e fantasia", () => {
    const result = parseBrasilApiCnpj(
      {
        razao_social: "EMPRESA TESTE LTDA",
        nome_fantasia: "Empresa Teste",
        descricao_situacao_cadastral: "ATIVA",
        situacao_cadastral: 2,
        data_inicio_atividade: "2020-01-15",
        logradouro: "Rua A",
        numero: "100",
        bairro: "Centro",
        municipio: "São Paulo",
        uf: "SP",
        cep: "01310100",
        cnae_fiscal: 4781400,
        cnae_fiscal_descricao: "Comércio varejista",
        natureza_juridica: "Sociedade Empresária Limitada",
      },
      "19131243000197"
    );
    assert.ok(result);
    assert.equal(result!.legalName, "EMPRESA TESTE LTDA");
    assert.equal(result!.businessName, "Empresa Teste");
    assert.equal(result!.address.city, "São Paulo");
  });

  it("getCnpjStatusWarnings informa baixado e inapto", () => {
    assert.deepEqual(getCnpjStatusWarnings(8), [CNPJ_BAIXADO_MESSAGE]);
    assert.deepEqual(getCnpjStatusWarnings(4), [CNPJ_INAPTO_MESSAGE]);
    assert.deepEqual(getCnpjStatusWarnings(2), []);
  });

  it("11. CNPJ localmente inválido não consulta API", async () => {
    const lookup = await lookupCnpj("00000000000000");
    assert.equal(lookup.valid, false);
    assert.equal(lookup.status, "INVALID");
    assert.equal(lookup.code, "INVALID_CNPJ");
    assert.notEqual(lookup.error, "CNPJ inválido");
  });

  it("9. lookup timeout + CNPJ local válido não bloqueia cadastro", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    }) as typeof fetch;
    try {
      const lookup = await lookupCnpj(NUMERIC_VALID);
      assert.equal(lookup.valid, true);
      assert.equal(lookup.status, "TIMEOUT");
      assert.equal(lookup.unavailable, true);
      assert.equal(lookup.error, CNPJ_LOOKUP_UNAVAILABLE_MESSAGE);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("10. lookup 503 + CNPJ válido não bloqueia cadastro", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => new Response("fail", { status: 503 })) as typeof fetch;
    try {
      const lookup = await lookupCnpj(RFB_ALNUM);
      assert.equal(lookup.valid, true);
      assert.equal(lookup.status, "UNAVAILABLE");
      assert.equal(lookup.code, "CNPJ_LOOKUP_UNAVAILABLE");
      assert.equal((lookup.error ?? "").includes("CNPJ inválido"), false);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("API 400 em CNPJ alfanumérico válido vira UNAVAILABLE, não inválido", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => new Response("bad", { status: 400 })) as typeof fetch;
    try {
      const lookup = await lookupCnpj(RFB_ALNUM);
      assert.equal(lookup.valid, true);
      assert.equal(lookup.status, "UNAVAILABLE");
    } finally {
      globalThis.fetch = original;
    }
  });
});
