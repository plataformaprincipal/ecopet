import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  E2E_TEST_HEADER,
  isAuthorizedE2ePreviewRequest,
  shouldSkipAuthRateLimitForE2e,
} from "./e2e-preview-auth";
import { clientIp, clientIpForRateLimit } from "./rate-limit";

function req(headers: Record<string, string>): Request {
  return new Request("https://homolog.eccopet.com/api/auth/login", {
    method: "POST",
    headers,
  });
}

describe("e2e preview auth gate (fail-closed)", () => {
  const secret = "preview-e2e-secret-test-only";

  it("Production ignora qualquer bypass E2E", () => {
    const env = {
      VERCEL_ENV: "production",
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(
      isAuthorizedE2ePreviewRequest(req({ [E2E_TEST_HEADER]: secret }), env),
      false
    );
  });

  it("Preview normal sem modo/secret/header → não autorizado", () => {
    const env = { VERCEL_ENV: "preview" } as NodeJS.ProcessEnv;
    assert.equal(isAuthorizedE2ePreviewRequest(req({}), env), false);
  });

  it("Preview com modo mas secret ausente → fail closed", () => {
    const env = {
      VERCEL_ENV: "preview",
      E2E_TEST_MODE: "true",
    } as NodeJS.ProcessEnv;
    assert.equal(
      isAuthorizedE2ePreviewRequest(req({ [E2E_TEST_HEADER]: "anything" }), env),
      false
    );
  });

  it("Preview com modo+secret mas header ausente → fail closed", () => {
    const env = {
      VERCEL_ENV: "preview",
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(isAuthorizedE2ePreviewRequest(req({}), env), false);
  });

  it("Preview com header errado → fail closed", () => {
    const env = {
      VERCEL_ENV: "preview",
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(
      isAuthorizedE2ePreviewRequest(req({ [E2E_TEST_HEADER]: "wrong" }), env),
      false
    );
  });

  it("Preview E2E autorizado com todas as condições", () => {
    const env = {
      VERCEL_ENV: "preview",
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(
      isAuthorizedE2ePreviewRequest(req({ [E2E_TEST_HEADER]: secret }), env),
      true
    );
  });

  it("Development / sem VERCEL_ENV preview → não autorizado", () => {
    const env = {
      VERCEL_ENV: "development",
      E2E_TEST_MODE: "true",
      E2E_TEST_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(
      isAuthorizedE2ePreviewRequest(req({ [E2E_TEST_HEADER]: secret }), env),
      false
    );
  });
});

describe("clientIpForRateLimit (Production vs Preview E2E)", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("Production respeita edge IP (ignora x-forwarded-for sintético + header E2E)", () => {
    process.env.VERCEL_ENV = "production";
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = "prod-should-ignore";
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "10.250.1.1",
      [E2E_TEST_HEADER]: "prod-should-ignore",
    });
    assert.equal(clientIp(r), "203.0.113.10");
    assert.equal(clientIpForRateLimit(r), "203.0.113.10");
  });

  it("Preview normal respeita edge IP (sem autorização E2E)", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.E2E_TEST_MODE;
    delete process.env.E2E_TEST_SECRET;
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.20",
      "x-forwarded-for": "10.250.2.2",
    });
    assert.equal(clientIpForRateLimit(r), "203.0.113.20");
  });

  it("Preview sem autorização continua limitado ao edge IP mesmo com header falso", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = "real-secret";
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.30",
      "x-forwarded-for": "10.250.3.3",
      [E2E_TEST_HEADER]: "wrong-secret",
    });
    assert.equal(clientIpForRateLimit(r), "203.0.113.30");
  });

  it("Preview E2E autorizado usa IP sintético (evita 429 indevido na carga E2E)", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = "e2e-ok";
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.40",
      "x-forwarded-for": "10.250.4.4",
      [E2E_TEST_HEADER]: "e2e-ok",
    });
    assert.equal(clientIpForRateLimit(r), "10.250.4.4");
    assert.equal(shouldSkipAuthRateLimitForE2e(r), true);
  });

  it("Production nunca faz skip de rate limit E2E", () => {
    process.env.VERCEL_ENV = "production";
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = "e2e-ok";
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.40",
      "x-forwarded-for": "10.250.4.4",
      [E2E_TEST_HEADER]: "e2e-ok",
    });
    assert.equal(shouldSkipAuthRateLimitForE2e(r), false);
  });

  it("secret ausente → fail closed (edge IP)", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.E2E_TEST_MODE = "true";
    delete process.env.E2E_TEST_SECRET;
    const r = req({
      "x-vercel-forwarded-for": "203.0.113.50",
      "x-forwarded-for": "10.250.5.5",
      [E2E_TEST_HEADER]: "anything",
    });
    assert.equal(clientIpForRateLimit(r), "203.0.113.50");
  });
});
