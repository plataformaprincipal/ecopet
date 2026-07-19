import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import {
  getTurnstilePublicConfig,
  isTurnstileEnabled,
  isTurnstileSiteKeyConfigured,
  maskSiteKey,
} from "./config";
import {
  getTurnstileSanitizedStatus,
  getTurnstileServerConfig,
  isTurnstileConfigured,
  isTurnstileServerEnabled,
} from "./server-config";
import {
  TURNSTILE_ACTIONS,
  isTurnstileAction,
  registerActionForRole,
} from "./actions";
import {
  detectTurnstileEnvironment,
  getTurnstileAllowedHostnames,
  isHostnameAllowed,
} from "./hostname";
import { mapCloudflareErrorCodes, turnstilePublicMessage } from "./errors";
import { turnstileTokenSchema } from "./schemas";

describe("turnstile config", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("configuração ausente", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    assert.equal(isTurnstileSiteKeyConfigured(), false);
    assert.equal(isTurnstileConfigured(), false);
    assert.equal(isTurnstileEnabled(), false);
    assert.equal(isTurnstileServerEnabled(), false);
    assert.equal(getTurnstileServerConfig(), null);
    assert.equal(getTurnstileSanitizedStatus().status, "NOT_CONFIGURED");
  });

  it("configuração válida", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAAtestsitesiteKEY12";
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAAtestsecretSECRETKEY99";
    delete process.env.TURNSTILE_ENABLED;
    assert.equal(isTurnstileConfigured(), true);
    assert.equal(isTurnstileEnabled(), true);
    assert.equal(isTurnstileServerEnabled(), true);
    const server = getTurnstileServerConfig();
    assert.ok(server);
    assert.equal(server!.secretKey.startsWith("0x4"), true);
    assert.equal(getTurnstilePublicConfig().siteKey.length > 0, true);
    assert.equal(getTurnstileSanitizedStatus().status, "ACTIVE");
  });

  it("Secret Key não aparece no status sanitizado / público", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAAtestsitesiteKEY12";
    process.env.TURNSTILE_SECRET_KEY = "SUPER_SECRET_TURNSTILE_VALUE_XYZ";
    const status = getTurnstileSanitizedStatus();
    const pub = getTurnstilePublicConfig();
    const dumped = JSON.stringify({ status, pub, masked: maskSiteKey(pub.siteKey) });
    assert.ok(!dumped.includes("SUPER_SECRET_TURNSTILE_VALUE_XYZ"));
    assert.equal(status.secretKeyConfigured, true);
    assert.ok(!("secretKey" in status));
    assert.ok(!("secretKey" in pub));
  });

  it("Site Key disponível ao componente via public config", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAApublicSiteKeyValue1";
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAAtestsecretSECRETKEY99";
    assert.equal(getTurnstilePublicConfig().siteKey, "0x4AAAAAAApublicSiteKeyValue1");
  });

  it("TURNSTILE_ENABLED=false desativa", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAAtestsitesiteKEY12";
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAAtestsecretSECRETKEY99";
    process.env.TURNSTILE_ENABLED = "false";
    assert.equal(isTurnstileEnabled(), false);
    assert.equal(isTurnstileServerEnabled(), false);
    assert.equal(getTurnstileSanitizedStatus().status, "DISABLED");
  });

  it("módulo público não contém literal da Secret env", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const configPath = path.join(__dirname, "config.ts");
    const src = await fs.readFile(configPath, "utf8");
    assert.ok(!src.includes("TURNSTILE_SECRET_KEY"));
    assert.ok(!src.includes("secretKey"));
  });
});

describe("turnstile actions / hostnames / schemas", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("actions tipadas e rejeita arbitrárias", () => {
    assert.equal(isTurnstileAction(TURNSTILE_ACTIONS.REGISTER_CLIENT), true);
    assert.equal(isTurnstileAction("hack_me"), false);
    assert.equal(registerActionForRole("PARTNER"), TURNSTILE_ACTIONS.REGISTER_PARTNER);
    assert.equal(registerActionForRole("ONG"), TURNSTILE_ACTIONS.REGISTER_NGO);
  });

  it("token ausente / vazio / malformado", () => {
    assert.equal(turnstileTokenSchema.safeParse("").success, false);
    assert.equal(turnstileTokenSchema.safeParse("short").success, false);
    assert.equal(turnstileTokenSchema.safeParse("a".repeat(30) + "!!").success, false);
    assert.equal(
      turnstileTokenSchema.safeParse("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345").success,
      true
    );
  });

  it("hostnames produção sem localhost", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    const list = getTurnstileAllowedHostnames();
    assert.equal(list.includes("localhost"), false);
    assert.equal(isHostnameAllowed("localhost", list), false);
    assert.equal(detectTurnstileEnvironment(), "production");
  });

  it("desenvolvimento permite localhost", () => {
    process.env.VERCEL_ENV = "development";
    const list = getTurnstileAllowedHostnames();
    assert.equal(isHostnameAllowed("localhost", list), true);
  });

  it("códigos Cloudflare mapeados e mensagens sem segredo", () => {
    assert.equal(mapCloudflareErrorCodes(["timeout-or-duplicate"]), "TOKEN_EXPIRED");
    assert.equal(mapCloudflareErrorCodes(["invalid-input-response"]), "TOKEN_INVALID");
    const msg = turnstilePublicMessage("ACTION_MISMATCH");
    assert.ok(!msg.toLowerCase().includes("secret"));
    assert.ok(msg.length > 5);
  });
});

describe("turnstile verify (fetch mock)", () => {
  const prev = { ...process.env };
  let fetchMock: ReturnType<typeof mock.method> | null = null;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "0x4AAAAAAAtestsitesiteKEY12";
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAAtestsecretSECRETKEY99";
    process.env.TURNSTILE_ENABLED = "true";
    process.env.VERCEL_ENV = "production";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "eccopet.com,www.eccopet.com";
    delete process.env.TURNSTILE_DEV_BYPASS;
  });

  afterEach(() => {
    fetchMock?.mock.restore();
    fetchMock = null;
    process.env = { ...prev };
  });

  it("token ausente falha em produção habilitada", async () => {
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: "",
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
      flow: "register_client",
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "TOKEN_MISSING");
  });

  it("token válido + action/hostname ok", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response(
        JSON.stringify({
          success: true,
          action: "register_client",
          hostname: "eccopet.com",
          challenge_ts: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { verifyTurnstileToken } = await import("./verify");
    const token = `VALIDTOKEN${Date.now()}ABCDEFGHIJKLMNOP`;
    const result = await verifyTurnstileToken({
      token,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
      flow: "register_client",
      remoteIp: "1.2.3.4",
    });
    assert.equal(result.success, true);
    assert.equal(result.code, "OK");
    assert.equal(result.action, "register_client");
    assert.equal(result.hostname, "eccopet.com");
  });

  it("action incorreta rejeita", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response(
        JSON.stringify({
          success: true,
          action: "other_action",
          hostname: "eccopet.com",
          challenge_ts: new Date().toISOString(),
        }),
        { status: 200 }
      )
    );
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `ACTIONBAD${Date.now()}ABCDEFGHIJKLMNOPQR`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "ACTION_MISMATCH");
  });

  it("hostname incorreto rejeita", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response(
        JSON.stringify({
          success: true,
          action: "register_client",
          hostname: "evil.example",
          challenge_ts: new Date().toISOString(),
        }),
        { status: 200 }
      )
    );
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `HOSTBAD${Date.now()}ABCDEFGHIJKLMNOPQRST`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "HOSTNAME_MISMATCH");
  });

  it("Cloudflare success=false → rejeitado", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }),
        { status: 200 }
      )
    );
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `CFBAD${Date.now()}ABCDEFGHIJKLMNOPQRSTUV`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "TOKEN_INVALID");
  });

  it("timeout AbortError → TIMEOUT", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () => {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `TIMEOUT${Date.now()}ABCDEFGHIJKLMNOPQRST`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "TIMEOUT");
  });

  it("bypass proibido em produção", async () => {
    process.env.TURNSTILE_DEV_BYPASS = "1";
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `BYPASS${Date.now()}ABCDEFGHIJKLMNOPQRSTU`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    assert.equal(result.success, false);
    assert.equal(result.code, "BYPASS_FORBIDDEN");
  });

  it("body siteverify nunca vazado no resultado", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      new Response(
        JSON.stringify({
          success: false,
          "error-codes": ["internal-error"],
          secret_leak: "SHOULD_NOT_APPEAR",
        }),
        { status: 200 }
      )
    );
    const { verifyTurnstileToken } = await import("./verify");
    const result = await verifyTurnstileToken({
      token: `LEAKCHK${Date.now()}ABCDEFGHIJKLMNOPQRS`,
      expectedAction: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    });
    const dumped = JSON.stringify(result);
    assert.ok(!dumped.includes("SHOULD_NOT_APPEAR"));
    assert.ok(!dumped.includes(process.env.TURNSTILE_SECRET_KEY!));
  });
});
