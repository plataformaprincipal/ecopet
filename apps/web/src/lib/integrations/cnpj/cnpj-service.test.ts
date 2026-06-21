import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBrasilApiCnpj, getCnpjStatusWarnings } from "./cnpj-service";
import { CNPJ_BAIXADO_MESSAGE, CNPJ_INAPTO_MESSAGE } from "./types";

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
});
