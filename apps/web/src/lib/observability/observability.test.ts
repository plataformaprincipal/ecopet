import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  redactForObservability,
  hashIdentifier,
  sanitizeErrorMessage,
  isValidCorrelationId,
  newCorrelationId,
} from "./redaction";
import {
  getObservabilityHealthSnapshot,
  isBetterStackConfigured,
  listObservabilityFlags,
  resolveObservabilityEnvironment,
} from "./config";
import { classifyError, errorFingerprint } from "./error-capture";

describe("observability redaction", () => {
  it("redige secrets aninhados", () => {
    const out = redactForObservability({
      password: "secret",
      nested: { apiKey: "x", ok: 1 },
      Authorization: "Bearer abc",
    }) as Record<string, unknown>;
    assert.equal(out.password, "[REDACTED]");
    assert.equal((out.nested as Record<string, unknown>).apiKey, "[REDACTED]");
    assert.equal((out.nested as Record<string, unknown>).ok, 1);
    assert.equal(out.Authorization, "[REDACTED]");
  });

  it("trata circular", () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    const out = redactForObservability(a) as Record<string, unknown>;
    assert.equal(out.self, "[Circular]");
  });

  it("sanitiza mensagem com Bearer/sk_", () => {
    const s = sanitizeErrorMessage("fail Bearer sk_test_abc and sk_live_xyz");
    assert.ok(!s.includes("sk_test"));
    assert.ok(s.includes("[REDACTED]"));
  });

  it("hash identifier estável", () => {
    assert.equal(hashIdentifier("user1"), hashIdentifier("user1"));
    assert.notEqual(hashIdentifier("user1"), hashIdentifier("user2"));
  });

  it("correlation id válido", () => {
    assert.equal(isValidCorrelationId("abc"), false);
    assert.equal(isValidCorrelationId(newCorrelationId()), true);
  });
});

describe("observability config", () => {
  it("health não inclui token", () => {
    const h = getObservabilityHealthSnapshot();
    assert.ok(!("sourceToken" in h));
    assert.equal(typeof h.tokenConfigured, "boolean");
    assert.equal(h.sessionReplaySupported, false);
    assert.equal(h.sentryDeprecated, true);
  });

  it("lista flags", () => {
    const flags = listObservabilityFlags();
    assert.equal(typeof flags.betterStackLogs, "boolean");
    assert.equal(typeof flags.tracing, "boolean");
  });

  it("resolve environment", () => {
    const prev = process.env.BETTER_STACK_ENVIRONMENT;
    process.env.BETTER_STACK_ENVIRONMENT = "production";
    assert.equal(resolveObservabilityEnvironment(), "production");
    if (prev === undefined) delete process.env.BETTER_STACK_ENVIRONMENT;
    else process.env.BETTER_STACK_ENVIRONMENT = prev;
  });

  it("isBetterStackConfigured exige token+host", () => {
    const t = process.env.BETTER_STACK_SOURCE_TOKEN;
    const h = process.env.BETTER_STACK_HOST;
    delete process.env.BETTER_STACK_SOURCE_TOKEN;
    delete process.env.BETTER_STACK_HOST;
    delete process.env.LOGTAIL_SOURCE_TOKEN;
    assert.equal(isBetterStackConfigured(), false);
    if (t !== undefined) process.env.BETTER_STACK_SOURCE_TOKEN = t;
    if (h !== undefined) process.env.BETTER_STACK_HOST = h;
  });
});

describe("error classification", () => {
  it("classifica categorias comuns", () => {
    assert.equal(classifyError(new Error("Unauthorized")), "authentication");
    assert.equal(classifyError(new Error("rate limit exceeded")), "rate_limit");
    assert.equal(classifyError(new Error("prisma timeout")), "database");
  });

  it("fingerprint estável", () => {
    const e = new Error("boom");
    assert.equal(errorFingerprint(e, "/api/x"), errorFingerprint(e, "/api/x"));
  });
});
