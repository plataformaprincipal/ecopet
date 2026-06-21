import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateRequiredDocuments,
  AUTONOMOUS_DOCS_MISSING_MESSAGE,
  CORPORATE_DOCS_MISSING_MESSAGE,
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_CNPJ_CARD,
  DOC_SOCIAL_CONTRACT,
} from "./document-validation";

describe("document-validation", () => {
  it("autônomo — sem documento do responsável bloqueia", () => {
    const r = validateRequiredDocuments("AUTONOMOUS", [DOC_RESIDENCE_PROOF]);
    assert.equal(r.valid, false);
    assert.equal(r.message, AUTONOMOUS_DOCS_MISSING_MESSAGE);
  });

  it("autônomo — sem comprovante bloqueia", () => {
    const r = validateRequiredDocuments("AUTONOMOUS", [DOC_LEGAL_REP]);
    assert.equal(r.valid, false);
  });

  it("autônomo — ambos enviados permite", () => {
    const r = validateRequiredDocuments("AUTONOMOUS", [DOC_LEGAL_REP, DOC_RESIDENCE_PROOF]);
    assert.equal(r.valid, true);
  });

  it("empresa — sem CNPJ bloqueia", () => {
    const r = validateRequiredDocuments("CORPORATE", [
      DOC_LEGAL_REP,
      DOC_RESIDENCE_PROOF,
      DOC_SOCIAL_CONTRACT,
    ]);
    assert.equal(r.valid, false);
    assert.equal(r.message, CORPORATE_DOCS_MISSING_MESSAGE);
  });

  it("empresa — sem comprovante bloqueia", () => {
    const r = validateRequiredDocuments("CORPORATE", [
      DOC_LEGAL_REP,
      DOC_CNPJ_CARD,
      DOC_SOCIAL_CONTRACT,
    ]);
    assert.equal(r.valid, false);
  });

  it("empresa — sem documento do responsável bloqueia", () => {
    const r = validateRequiredDocuments("CORPORATE", [
      DOC_RESIDENCE_PROOF,
      DOC_CNPJ_CARD,
      DOC_SOCIAL_CONTRACT,
    ]);
    assert.equal(r.valid, false);
  });

  it("empresa — sem contrato social bloqueia", () => {
    const r = validateRequiredDocuments("CORPORATE", [
      DOC_LEGAL_REP,
      DOC_RESIDENCE_PROOF,
      DOC_CNPJ_CARD,
    ]);
    assert.equal(r.valid, false);
  });

  it("empresa — todos obrigatórios permite", () => {
    const r = validateRequiredDocuments("CORPORATE", [
      DOC_LEGAL_REP,
      DOC_RESIDENCE_PROOF,
      DOC_CNPJ_CARD,
      DOC_SOCIAL_CONTRACT,
    ]);
    assert.equal(r.valid, true);
  });
});
