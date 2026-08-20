import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GOOGLE_AUTH_SCOPES,
  GOOGLE_PRODUCTION_ORIGIN,
  canUnlinkGoogle,
  googleCallbackPath,
  googleOnboardingRoles,
  isAllowedGoogleRole,
  isGoogleAuthConfigured,
  mapGoogleOAuthError,
  safeInternalPath,
  shouldAutoLinkByEmail,
} from "./google-oauth";

describe("google oauth protocol", () => {
  it("requires both client id and secret", () => {
    assert.equal(isGoogleAuthConfigured({}), false);
    assert.equal(
      isGoogleAuthConfigured({ GOOGLE_CLIENT_ID: "short", GOOGLE_CLIENT_SECRET: "also-short" }),
      false
    );
    assert.equal(
      isGoogleAuthConfigured({
        GOOGLE_CLIENT_ID: "1234567890.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "GOCSPX-abcdefghijklmnopqrstuvwxyz",
      }),
      true
    );
  });

  it("uses a single callback path", () => {
    assert.equal(googleCallbackPath(), "/api/auth/google/callback");
    assert.equal(`${GOOGLE_PRODUCTION_ORIGIN}${googleCallbackPath()}`, "https://www.eccopet.com/api/auth/google/callback");
  });

  it("requests only openid email profile", () => {
    assert.equal(GOOGLE_AUTH_SCOPES, "openid email profile");
    assert.doesNotMatch(GOOGLE_AUTH_SCOPES, /drive|calendar|gmail|contacts/i);
  });

  it("blocks open redirects", () => {
    assert.equal(safeInternalPath("https://evil.test"), "/");
    assert.equal(safeInternalPath("//evil.test"), "/");
    assert.equal(safeInternalPath("/\\evil"), "/");
    assert.equal(safeInternalPath("javascript:alert(1)"), "/");
    assert.equal(safeInternalPath("/dashboard/client"), "/dashboard/client");
    assert.equal(safeInternalPath("/login?next=/ok"), "/login?next=/ok");
  });

  it("maps provider errors without leaking tokens", () => {
    assert.equal(mapGoogleOAuthError("access_denied"), "CANCELLED");
    assert.equal(mapGoogleOAuthError("invalid_grant"), "GENERIC");
    assert.equal(mapGoogleOAuthError("invalid_state"), "INVALID_STATE");
  });

  it("never auto-links by email", () => {
    assert.equal(shouldAutoLinkByEmail(), false);
  });

  it("never allows ADMIN via Google", () => {
    assert.equal(isAllowedGoogleRole("ADMIN"), false);
    assert.equal(isAllowedGoogleRole("GESTOR"), false);
    assert.deepEqual([...googleOnboardingRoles()], ["CLIENT", "PARTNER", "ONG"]);
  });

  it("refuses unlink of the last auth method", () => {
    assert.equal(canUnlinkGoogle({ hasPassword: false, googleLinked: true }), false);
    assert.equal(canUnlinkGoogle({ hasPassword: true, googleLinked: true }), true);
    assert.equal(canUnlinkGoogle({ hasPassword: true, googleLinked: false }), false);
  });
});
