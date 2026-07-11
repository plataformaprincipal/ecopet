/**
 * Foundation tests — camada central EcoPet AI.
 * Sem mocks de resposta de IA; valida política, custos e contratos.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHash } from "node:crypto";

import { AI_CONFIG, estimateCostUsd } from "../apps/web/src/lib/ai/ai-config.ts";
import {
  canAccessModule,
  requiresExplicitConfirmation,
  PROTECTED_PROFILE_FIELDS,
  CRITICAL_ACTIONS,
} from "../apps/web/src/lib/ai/ai-policy.ts";
import { AI_RUNTIME_ERROR_CODES, userFacingAiMessage } from "../apps/web/src/lib/ai/ai-errors.ts";
import { AI_SAFETY_DISCLAIMER, normalizeLocale } from "../apps/web/src/lib/ai/ai-disclaimer.ts";
import { getModuleSystemPrompt } from "../apps/web/src/lib/ai/ai-prompts.ts";
import { UserRole } from "@prisma/client";

function chunkText(content, size = 800) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let i = 0; i < normalized.length; i += size) chunks.push(normalized.slice(i, i + size));
  return chunks;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

describe("AI config & privacy", () => {
  it("configures server-only key accessor", () => {
    assert.equal(typeof AI_CONFIG.isConfigured, "boolean");
    assert.ok(AI_CONFIG.maxOutputTokens > 0);
    assert.ok(AI_CONFIG.dailyUserLimit > 0);
  });

  it("has safety disclaimer in pt-BR, en-US, es-ES", () => {
    assert.match(AI_SAFETY_DISCLAIMER["pt-BR"], /não substitui/i);
    assert.match(AI_SAFETY_DISCLAIMER["en-US"], /does not replace/i);
    assert.match(AI_SAFETY_DISCLAIMER["es-ES"], /no sustituye/i);
  });

  it("normalizes locales", () => {
    assert.equal(normalizeLocale("en"), "en-US");
    assert.equal(normalizeLocale("es-MX"), "es-ES");
    assert.equal(normalizeLocale("pt-BR"), "pt-BR");
  });
});

describe("AI policy", () => {
  it("allows client modules and blocks admin for client", () => {
    assert.equal(canAccessModule(UserRole.CLIENT, "pets"), true);
    assert.equal(canAccessModule(UserRole.CLIENT, "admin"), false);
    assert.equal(canAccessModule(UserRole.PARTNER, "partner"), true);
    assert.equal(canAccessModule(UserRole.ONG, "ong"), true);
    assert.equal(canAccessModule(UserRole.ADMIN, "moderation"), true);
  });

  it("requires confirmation for critical actions", () => {
    assert.equal(requiresExplicitConfirmation("confirmCheckout"), true);
    assert.equal(requiresExplicitConfirmation("confirmAppointment"), true);
    assert.equal(requiresExplicitConfirmation("sendMessage"), true);
    assert.equal(requiresExplicitConfirmation("chat"), false);
    assert.ok(CRITICAL_ACTIONS.has("publishPost"));
  });

  it("protects sensitive profile fields", () => {
    assert.ok(PROTECTED_PROFILE_FIELDS.has("cpf"));
    assert.ok(PROTECTED_PROFILE_FIELDS.has("email"));
    assert.ok(PROTECTED_PROFILE_FIELDS.has("phone"));
  });
});

describe("AI errors", () => {
  it("returns safe user-facing messages without secrets", () => {
    const msg = userFacingAiMessage(AI_RUNTIME_ERROR_CODES.KEY_MISSING, "pt-BR");
    assert.ok(!/sk-|api[_-]?key|stack/i.test(msg));
    assert.ok(msg.length > 10);
  });
});

describe("AI embeddings helpers", () => {
  it("chunks and hashes content", () => {
    const chunks = chunkText("a".repeat(2000), 500);
    assert.equal(chunks.length, 4);
    assert.equal(createHash("sha256").update("abc").digest("hex").length, 64);
  });

  it("computes cosine similarity", () => {
    assert.ok(cosineSimilarity([1, 0], [1, 0]) > 0.99);
    assert.ok(cosineSimilarity([1, 0], [0, 1]) < 0.01);
  });
});

describe("AI prompts", () => {
  it("includes vet prohibitions in pets prompt", () => {
    const p = getModuleSystemPrompt("pets", "pt-BR");
    assert.match(p, /diagnóstico/i);
    assert.match(p, /veterinár/i);
  });

  it("includes marketplace prohibitions", () => {
    const p = getModuleSystemPrompt("marketplace", "pt-BR");
    assert.match(p, /estoque|preço/i);
  });
});

describe("AI cost", () => {
  it("estimates cost for gpt-4o-mini", () => {
    const cost = estimateCostUsd("gpt-4o-mini", 1000, 1000);
    assert.ok(cost > 0);
    assert.ok(cost < 0.01);
  });
});

describe("AI session / persona contracts", () => {
  it("session missing and persona codes exist", () => {
    assert.equal(AI_RUNTIME_ERROR_CODES.SESSION_MISSING, "AI_SESSION_MISSING");
    assert.equal(AI_RUNTIME_ERROR_CODES.PERSONA_INVALID, "AI_PERSONA_INVALID");
    assert.equal(AI_RUNTIME_ERROR_CODES.CONFIRMATION_REQUIRED, "AI_CONFIRMATION_REQUIRED");
    assert.equal(AI_RUNTIME_ERROR_CODES.BUDGET_EXCEEDED, "AI_BUDGET_EXCEEDED");
  });
});
