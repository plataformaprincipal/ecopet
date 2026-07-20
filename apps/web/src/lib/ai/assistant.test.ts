/**
 * Testes do Assistente Virtual (sem OpenAI live).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAssistantPersona, getPersonaScopeLines } from "./assistant/personas";
import { buildAssistantSystemPrompt } from "./assistant/prompts";
import { sanitizeAssistantUserInput } from "./assistant/security";
import { assertAssistantIpRateLimit } from "./assistant/rate-limit";
import { AI_RUNTIME_ERROR_CODES } from "./ai-errors";

describe("assistant personas", () => {
  it("mapeia roles", () => {
    assert.equal(resolveAssistantPersona("CLIENT"), "CLIENT");
    assert.equal(resolveAssistantPersona("PARTNER"), "PARTNER");
    assert.equal(resolveAssistantPersona("ONG"), "ONG");
    assert.equal(resolveAssistantPersona("ADMIN"), "ADMIN");
  });

  it("escopos distintos e sem inventar admin para cliente", () => {
    const client = getPersonaScopeLines("CLIENT").join(" ");
    assert.ok(client.includes("Marketplace"));
    assert.ok(client.includes("Não revele ferramentas administrativas"));
    const admin = getPersonaScopeLines("ADMIN").join(" ");
    assert.ok(admin.includes("Administrador"));
  });
});

describe("assistant prompts / security", () => {
  it("prompt inclui persona e idioma", () => {
    const p = buildAssistantSystemPrompt({
      persona: "CLIENT",
      locale: "pt-BR",
      userDisplayName: "Ana",
    });
    assert.ok(p.includes("Ana"));
    assert.ok(p.includes("português") || p.includes("pt-BR") || p.includes("Cliente"));
  });

  it("sanitize remove e-mail", () => {
    const out = sanitizeAssistantUserInput("fale com a@b.com");
    assert.ok(!out.includes("a@b.com"));
  });
});

describe("assistant rate limit IP", () => {
  it("aceita IP normal sem throw imediato", () => {
    assert.doesNotThrow(() => assertAssistantIpRateLimit("203.0.113.10"));
  });
});

describe("assistant error codes", () => {
  it("mantém códigos estáveis", () => {
    assert.ok(AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED);
    assert.ok(AI_RUNTIME_ERROR_CODES.RATE_LIMIT);
  });
});
