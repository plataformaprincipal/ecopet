import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cnpjCharValue,
  cnpjIssueMessage,
  inspectCnpjInput,
  isValidCnpj,
  maskCnpj,
  normalizeCnpj,
  validateCnpjChecksum,
} from "./documents-shared";
import { cnpjSchema } from "@/schemas/auth";
import { partnerCnpjSchema } from "@/schemas/partner-register";
import { ongCnpjSchema } from "@/schemas/ong-register";

/** Exemplo oficial da Receita Federal / SERPRO: 12.ABC.345/01DE-35 */
const RFB_ALNUM = "12ABC34501DE35";
const RFB_ALNUM_MASKED = "12.ABC.345/01DE-35";
const NUMERIC_VALID = "11444777000161";
const NUMERIC_VALID_MASKED = "11.444.777/0001-61";
const NUMERIC_INVALID = "11444777000162";

describe("CNPJ 2026 — motor único", () => {
  it("1. CNPJ numérico válido → PASS", () => {
    assert.equal(isValidCnpj(NUMERIC_VALID), true);
    assert.equal(validateCnpjChecksum(NUMERIC_VALID), true);
  });

  it("2. CNPJ numérico inválido → FAIL", () => {
    assert.equal(isValidCnpj(NUMERIC_INVALID), false);
    assert.equal(inspectCnpjInput(NUMERIC_INVALID), "check_digit");
  });

  it("3. CNPJ numérico formatado → PASS", () => {
    assert.equal(isValidCnpj(NUMERIC_VALID_MASKED), true);
    assert.equal(normalizeCnpj(NUMERIC_VALID_MASKED), NUMERIC_VALID);
  });

  it("4. CNPJ alfanumérico válido oficial RFB → PASS", () => {
    assert.equal(cnpjCharValue("A"), 17);
    assert.equal(cnpjCharValue("0"), 0);
    assert.equal(isValidCnpj(RFB_ALNUM), true);
    assert.equal(isValidCnpj(RFB_ALNUM_MASKED), true);
  });

  it("5. CNPJ alfanumérico inválido → FAIL", () => {
    assert.equal(isValidCnpj("12ABC34501DE36"), false);
    assert.equal(inspectCnpjInput("12ABC34501DE36"), "check_digit");
  });

  it("6. CNPJ alfanumérico formatado → PASS", () => {
    assert.equal(normalizeCnpj(RFB_ALNUM_MASKED), RFB_ALNUM);
    assert.equal(maskCnpj(RFB_ALNUM), RFB_ALNUM_MASKED);
    assert.equal(isValidCnpj(RFB_ALNUM_MASKED), true);
  });

  it("7. lowercase normaliza para uppercase → PASS", () => {
    assert.equal(normalizeCnpj("12.abc.345/01de-35"), RFB_ALNUM);
    assert.equal(isValidCnpj("12.abc.345/01de-35"), true);
  });

  it("8. caracteres inválidos → FAIL", () => {
    assert.equal(inspectCnpjInput("12ABC34501DE3!"), "structure");
    assert.equal(isValidCnpj("12ABC34501DE3!"), false);
  });

  it("não usa onlyDigits: letras sobrevivem à normalização", () => {
    assert.equal(normalizeCnpj(RFB_ALNUM_MASKED).includes("ABC"), true);
    assert.notEqual(normalizeCnpj(RFB_ALNUM_MASKED), "123450135");
  });

  it("não valida DV enquanto incompleto", () => {
    assert.equal(inspectCnpjInput(""), "empty");
    assert.equal(inspectCnpjInput("12.ABC.345"), "incomplete");
    assert.equal(cnpjIssueMessage("empty"), "Informe o CNPJ.");
    assert.equal(cnpjIssueMessage("incomplete"), "Continue digitando o CNPJ.");
    assert.equal(cnpjIssueMessage("check_digit"), "CNPJ com dígitos verificadores inválidos.");
  });

  it("12. Partner schema aceita numérico e alfanumérico", () => {
    assert.equal(partnerCnpjSchema.parse(NUMERIC_VALID_MASKED), NUMERIC_VALID);
    assert.equal(partnerCnpjSchema.parse(RFB_ALNUM_MASKED), RFB_ALNUM);
    assert.equal(cnpjSchema.parse(NUMERIC_VALID), NUMERIC_VALID);
  });

  it("13. ONG schema aceita numérico e alfanumérico", () => {
    assert.equal(ongCnpjSchema.parse(NUMERIC_VALID), NUMERIC_VALID);
    assert.equal(ongCnpjSchema.parse("12.abc.345/01de-35"), RFB_ALNUM);
  });

  it("schema rejeita DV inválido sem mensagem genérica de rede", () => {
    const result = partnerCnpjSchema.safeParse(NUMERIC_INVALID);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.message, "CNPJ com dígitos verificadores inválidos.");
    }
  });
});
