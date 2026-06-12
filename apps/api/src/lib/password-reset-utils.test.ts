import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashResetToken,
  validateResetPasswordFields,
  buildPasswordResetEmailBody,
  FORGOT_PASSWORD_MESSAGE,
} from "./password-reset-utils.js";

describe("password-reset-utils", () => {
  it("hashResetToken é determinístico e difere do token puro", () => {
    const token = "abc123";
    const hash = hashResetToken(token);
    assert.equal(hashResetToken(token), hash);
    assert.notEqual(hash, token);
    assert.equal(hash.length, 64);
  });

  it("validateResetPasswordFields exige mínimo 8 caracteres", () => {
    const short = validateResetPasswordFields("abc", "abc");
    assert.equal(short.valid, false);
    if (!short.valid) assert.equal(short.code, "WEAK_PASSWORD");

    const ok = validateResetPasswordFields("senha123", "senha123");
    assert.equal(ok.valid, true);
  });

  it("validateResetPasswordFields exige confirmação igual", () => {
    const mismatch = validateResetPasswordFields("senha1234", "senha5678");
    assert.equal(mismatch.valid, false);
    if (!mismatch.valid) assert.equal(mismatch.code, "PASSWORD_MISMATCH");
  });

  it("buildPasswordResetEmailBody inclui link e expiração", () => {
    const body = buildPasswordResetEmailBody("https://ecopet.test/reset?token=x");
    assert.match(body, /https:\/\/ecopet\.test\/reset\?token=x/);
    assert.match(body, /30 minutos/);
    assert.match(body, /Equipe EcoPet/);
  });

  it("FORGOT_PASSWORD_MESSAGE não revela existência do e-mail", () => {
    assert.match(FORGOT_PASSWORD_MESSAGE, /Se o e-mail estiver cadastrado/i);
    assert.doesNotMatch(FORGOT_PASSWORD_MESSAGE, /não encontrado|não existe/i);
  });
});
