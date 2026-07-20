/**
 * Testes da fundação IA (sem chamadas OpenAI ao vivo).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withRetry } from "./utils/retry";
import { sanitizeAiUserText, sanitizeAiMessages } from "./utils/sanitize-input";
import { buildPrompt } from "./utils/prompt-builder";
import { parseAiTextResponse, extractJsonBlock } from "./utils/response-parser";
import { maskSecretPreview } from "./foundation/mask";
import { AI_CONFIG } from "./ai-config";

describe("AI foundation — sanitize", () => {
  it("redige e-mail e CPF", () => {
    const { text, redacted } = sanitizeAiUserText(
      "Contato 529.982.247-25 email user@example.com"
    );
    assert.ok(redacted.includes("cpf"));
    assert.ok(redacted.includes("email"));
    assert.ok(!text.includes("user@example.com"));
    assert.ok(!text.includes("529.982.247-25"));
  });

  it("não altera system message", () => {
    const { messages } = sanitizeAiMessages([
      { role: "system", content: "keep email@x.com" },
      { role: "user", content: "meu email é a@b.com" },
    ]);
    assert.equal(messages[0].content, "keep email@x.com");
    assert.ok(messages[1].content.includes("REDACTED"));
  });
});

describe("AI foundation — retry", () => {
  it("retenta erro 429 e depois sucede", async () => {
    let n = 0;
    const result = await withRetry(
      async () => {
        n += 1;
        if (n < 3) {
          const err = Object.assign(new Error("rate"), { status: 429 });
          throw err;
        }
        return "ok";
      },
      { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 5 }
    );
    assert.equal(result, "ok");
    assert.equal(n, 3);
  });

  it("não retenta erro 400", async () => {
    let n = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            n += 1;
            const err = Object.assign(new Error("bad"), { status: 400 });
            throw err;
          },
          { maxAttempts: 3, baseDelayMs: 1 }
        ),
      /bad/
    );
    assert.equal(n, 1);
  });
});

describe("AI foundation — prompt / parser / mask", () => {
  it("buildPrompt versionado", () => {
    const p = buildPrompt({ module: "foundation", user: "ping" });
    assert.equal(p.version, 1);
    assert.ok(p.system.length > 0);
    assert.equal(p.user, "ping");
  });

  it("parse preview truncado", () => {
    const p = parseAiTextResponse("abcdefghijklmnop");
    assert.ok(p.preview.length <= 121);
    assert.deepEqual(extractJsonBlock('{"a":1}'), { a: 1 });
    assert.equal(extractJsonBlock("no json here"), null);
  });

  it("mascara secret", () => {
    const m = maskSecretPreview("sk-abcdefghijklmnop");
    assert.ok(m);
    assert.ok(!m!.includes("abcdefghijklmnop"));
  });

  it("config expõe timeout e retries", () => {
    assert.ok(AI_CONFIG.requestTimeoutMs > 0);
    assert.ok(AI_CONFIG.maxRetries >= 1);
  });
});
