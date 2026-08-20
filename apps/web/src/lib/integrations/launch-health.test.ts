import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getLaunchHealthRows, googleCloudConfigurationRequired } from "./launch-health";

describe("launch health", () => {
  it("never reports Facebook or Apple auth as ready", () => {
    const rows = getLaunchHealthRows({} as NodeJS.ProcessEnv);
    const fb = rows.find((r) => r.provider === "FACEBOOK_AUTH");
    const apple = rows.find((r) => r.provider === "APPLE_AUTH");
    assert.equal(fb?.verdict, "REMOVED");
    assert.equal(apple?.verdict, "REMOVED");
  });

  it("keeps Mercado Pago split as external enablement", () => {
    const rows = getLaunchHealthRows({} as NodeJS.ProcessEnv);
    const split = rows.find((r) => r.provider === "MERCADO_PAGO_SPLIT");
    assert.equal(split?.verdict, "SPLIT_REQUIRES_MP_ENABLEMENT");
  });

  it("documents the production Google Cloud URIs", () => {
    const cfg = googleCloudConfigurationRequired();
    assert.ok(cfg.authorizedJavascriptOrigins.includes("https://www.eccopet.com"));
    assert.ok(cfg.authorizedRedirectUris.includes("https://www.eccopet.com/api/auth/google/callback"));
  });

  it("does not mark Google ready without Cloud redirect evidence", () => {
    const rows = getLaunchHealthRows({
      GOOGLE_CLIENT_ID: "1234567890.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "GOCSPX-abcdefghijklmnopqrstuvwxyz",
    } as unknown as NodeJS.ProcessEnv);
    const google = rows.find((r) => r.provider === "GOOGLE_AUTH");
    assert.equal(google?.verdict, "EXTERNAL_CONFIG_REQUIRED");
  });
});
