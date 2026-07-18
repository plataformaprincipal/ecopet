import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  getEmailFromAddress,
  getEmailProvider,
  getResendApiKey,
  isEmailDomainVerified,
  isResendConfigured,
} from "./config";
import { mapResendError, sanitizeEmailErrorMessage } from "./errors";
import {
  clearResendOperationalError,
  getResendOperationalStatus,
  recordResendOperationalError,
} from "./resend-status";
import { __resetResendClientForTests, getResendClient } from "./resend";
import { renderEmailTemplate } from "./templates/render";
import { renderTestEmail, renderPartnerApprovedEmail } from "./templates/enterprise";

describe("email config", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    __resetResendClientForTests();
    clearResendOperationalError();
  });

  it("não trata placeholder como chave válida", () => {
    process.env.RESEND_API_KEY = "re_xxxxxxxxx";
    assert.equal(getResendApiKey(), undefined);
    assert.equal(isResendConfigured(), false);
  });

  it("lê EMAIL_PROVIDER=resend por padrão", () => {
    delete process.env.EMAIL_PROVIDER;
    assert.equal(getEmailProvider(), "resend");
  });

  it("monta from com nome sem hardcode de domínio de produção", () => {
    delete process.env.EMAIL_FROM;
    delete process.env.RESEND_FROM;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.SMTP_FROM_EMAIL;
    process.env.EMAIL_FROM_NAME = "EcoPet";
    assert.match(getEmailFromAddress(), /onboarding@resend\.dev/);
  });
});

describe("email errors", () => {
  it("sanitiza API keys em mensagens", () => {
    const msg = sanitizeEmailErrorMessage("invalid key re_AbCdEfGhIjKlMnOp");
    assert.ok(!msg.includes("re_AbCdEfGhIjKlMnOp"));
    assert.ok(msg.includes("re_***"));
  });

  it("mapeia 429 para rate limit", () => {
    const err = mapResendError({ statusCode: 429, message: "rate limit" });
    assert.equal(err.code, "EMAIL_RATE_LIMITED");
    assert.equal(err.retryable, true);
  });

  it("mapeia domínio não verificado", () => {
    const err = mapResendError({ statusCode: 422, message: "domain is not verified" });
    assert.equal(err.code, "EMAIL_DOMAIN_PENDING");
  });

  it("mapeia 401 sem vazar detalhe", () => {
    const err = mapResendError({ statusCode: 401, message: "API key invalid re_secret" });
    assert.equal(err.code, "EMAIL_UNAUTHORIZED");
    assert.ok(!err.message.includes("re_secret"));
  });
});

describe("resend status", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    clearResendOperationalError();
    __resetResendClientForTests();
  });

  afterEach(() => {
    process.env = { ...prev };
    clearResendOperationalError();
  });

  it("NOT_CONFIGURED sem chave", () => {
    delete process.env.RESEND_API_KEY;
    const s = getResendOperationalStatus();
    assert.equal(s.status, "NOT_CONFIGURED");
    assert.equal(s.configured, false);
  });

  it("DOMAIN_PENDING com sandbox", () => {
    process.env.RESEND_API_KEY = "re_test_key_valid_length";
    process.env.EMAIL_FROM = "onboarding@resend.dev";
    delete process.env.EMAIL_DOMAIN_VERIFIED;
    const s = getResendOperationalStatus();
    assert.equal(s.status, "DOMAIN_PENDING");
    assert.equal(s.available, true);
  });

  it("ACTIVE com domínio verificado", () => {
    process.env.RESEND_API_KEY = "re_test_key_valid_length";
    process.env.EMAIL_FROM = "noreply@eccopet.com";
    process.env.EMAIL_DOMAIN_VERIFIED = "true";
    assert.equal(isEmailDomainVerified(), true);
    const s = getResendOperationalStatus();
    assert.equal(s.status, "ACTIVE");
  });

  it("ERROR após falha registrada", () => {
    process.env.RESEND_API_KEY = "re_test_key_valid_length";
    process.env.EMAIL_FROM = "noreply@eccopet.com";
    process.env.EMAIL_DOMAIN_VERIFIED = "true";
    recordResendOperationalError("Falha sanitizada");
    const s = getResendOperationalStatus();
    assert.equal(s.status, "ERROR");
  });
});

describe("resend client singleton", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    __resetResendClientForTests();
  });

  it("retorna null sem chave", () => {
    delete process.env.RESEND_API_KEY;
    assert.equal(getResendClient(), null);
  });

  it("reutiliza a mesma instância", () => {
    process.env.RESEND_API_KEY = "re_test_key_valid_length";
    const a = getResendClient();
    const b = getResendClient();
    assert.ok(a);
    assert.equal(a, b);
  });
});

describe("templates", () => {
  it("renderiza welcome e test-email", () => {
    const welcome = renderEmailTemplate("welcome", {
      locale: "pt-BR",
      appUrl: "https://ecopet.example",
      name: "Ana",
      role: "CLIENT",
    });
    assert.match(welcome.subject, /EcoPet/i);
    assert.match(welcome.html, /Ana/);

    const test = renderTestEmail({
      locale: "pt-BR",
      appUrl: "https://ecopet.example",
      recipient: "ana@example.com",
    });
    assert.match(test.html, /teste/i);

    const partner = renderPartnerApprovedEmail({
      locale: "pt-BR",
      appUrl: "https://ecopet.example",
      name: "PetShop X",
    });
    assert.match(partner.subject, /Parceiro|aprovado/i);
  });

  it("templates enterprise escapam HTML em reason", () => {
    const tpl = renderEmailTemplate("partner-rejected", {
      locale: "pt-BR",
      appUrl: "https://ecopet.example",
      name: "Loja",
      reason: '<script>alert(1)</script>',
    });
    assert.ok(!tpl.html.includes("<script>"));
    assert.ok(tpl.html.includes("&lt;script&gt;") || tpl.html.includes("script"));
  });
});
