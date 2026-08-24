import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GOOGLE_AUTH_ALLOWED_ROLE,
  GOOGLE_AUTH_SCOPES,
  GOOGLE_PRODUCTION_ORIGIN,
  GOOGLE_PROVIDER,
  canCompleteGoogleOnboarding,
  canUnlinkGoogle,
  decideGoogleCallback,
  googleCallbackPath,
  googleOnboardingRoles,
  isAllowedGoogleRole,
  isGoogleAuthConfigured,
  mapGoogleOAuthError,
  resolveGoogleSignupRole,
  safeInternalPath,
  shouldAutoLinkByEmail,
} from "./google-oauth";
import { CLIENT_LEGAL } from "@/lib/legal/legal-links";

const client = {
  id: "user-client",
  role: "CLIENT",
  email: "arthur@email.com",
  accountStatus: "ACTIVE",
} as const;

function facts(overrides: Partial<Parameters<typeof decideGoogleCallback>[0]> = {}) {
  return {
    identity: { sub: "google-sub-1", email: "arthur@email.com", emailVerified: true },
    intent: "login" as const,
    currentUser: null,
    existingGoogleLink: null,
    emailOwner: null,
    ...overrides,
  };
}

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

  it("G1 novo Google verified sem e-mail cadastrado vai para onboarding CLIENT", () => {
    assert.deepEqual(decideGoogleCallback(facts()), { kind: "pending" });
    assert.equal(GOOGLE_AUTH_ALLOWED_ROLE, "CLIENT");
    assert.deepEqual([...googleOnboardingRoles()], ["CLIENT"]);
  });

  it("G2 termos não aceitos não completam o cadastro", () => {
    assert.deepEqual(canCompleteGoogleOnboarding({ termsAccepted: false, privacyAccepted: true }), {
      ok: false,
      code: "TERMS_REQUIRED",
    });
    assert.deepEqual(canCompleteGoogleOnboarding({ termsAccepted: true, privacyAccepted: false }), {
      ok: false,
      code: "TERMS_REQUIRED",
    });
  });

  it("G3 termos aceitos autorizam criar CLIENT", () => {
    assert.deepEqual(canCompleteGoogleOnboarding({ termsAccepted: true, privacyAccepted: true }), { ok: true });
    assert.equal(resolveGoogleSignupRole("PARTNER"), "CLIENT");
  });

  it("G4 CLIENT existente com e-mail verificado faz auto-link seguro", () => {
    assert.equal(
      shouldAutoLinkByEmail({
        provider: GOOGLE_PROVIDER,
        emailVerified: true,
        existingRole: "CLIENT",
        googleEmail: "Arthur@email.com",
        userEmail: "arthur@email.com",
      }),
      true
    );
    assert.deepEqual(decideGoogleCallback(facts({ emailOwner: client })), {
      kind: "autolink",
      userId: client.id,
    });
  });

  it("G5 CLIENT já vinculado faz login", () => {
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          existingGoogleLink: { userId: client.id, role: "CLIENT", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "session", userId: client.id }
    );
  });

  it("G6 PARTNER com o mesmo e-mail é bloqueado", () => {
    assert.equal(
      shouldAutoLinkByEmail({
        provider: GOOGLE_PROVIDER,
        emailVerified: true,
        existingRole: "PARTNER",
        googleEmail: "empresa@email.com",
        userEmail: "empresa@email.com",
      }),
      false
    );
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          identity: { sub: "sub", email: "empresa@email.com", emailVerified: true },
          emailOwner: { id: "p1", role: "PARTNER", email: "empresa@email.com", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "error", code: "PARTNER_GOOGLE_FORBIDDEN" }
    );
  });

  it("G7 ONG com o mesmo e-mail é bloqueada", () => {
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          identity: { sub: "sub", email: "ong@email.com", emailVerified: true },
          emailOwner: { id: "o1", role: "ONG", email: "ong@email.com", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "error", code: "ONG_GOOGLE_FORBIDDEN" }
    );
  });

  it("G8 ADMIN/GESTOR são bloqueados mesmo com e-mail idêntico", () => {
    assert.equal(isAllowedGoogleRole("ADMIN"), false);
    assert.equal(isAllowedGoogleRole("GESTOR"), false);
    assert.equal(isAllowedGoogleRole("PARTNER"), false);
    assert.equal(isAllowedGoogleRole("ONG"), false);
    assert.equal(isAllowedGoogleRole("CLIENT"), true);
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          emailOwner: { id: "a1", role: "ADMIN", email: "arthur@email.com", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "error", code: "ADMIN_FORBIDDEN" }
    );
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          emailOwner: { id: "g1", role: "GESTOR", email: "arthur@email.com", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "error", code: "ADMIN_FORBIDDEN" }
    );
  });

  it("G9 email_verified=false é bloqueado", () => {
    assert.deepEqual(
      decideGoogleCallback(facts({ identity: { sub: "sub", email: "arthur@email.com", emailVerified: false } })),
      { kind: "error", code: "EMAIL_NOT_VERIFIED" }
    );
    assert.equal(
      shouldAutoLinkByEmail({
        provider: GOOGLE_PROVIDER,
        emailVerified: false,
        existingRole: "CLIENT",
        googleEmail: "arthur@email.com",
        userEmail: "arthur@email.com",
      }),
      false
    );
  });

  it("G10 payload role=PARTNER é ignorado e permanece CLIENT", () => {
    assert.equal(resolveGoogleSignupRole("PARTNER"), "CLIENT");
    assert.equal(resolveGoogleSignupRole("ONG"), "CLIENT");
    assert.equal(resolveGoogleSignupRole("ADMIN"), "CLIENT");
    assert.equal(resolveGoogleSignupRole(undefined), "CLIENT");
  });

  it("G11 Google sub de outro User gera conflito e não transfere", () => {
    assert.deepEqual(
      decideGoogleCallback(
        facts({
          intent: "link",
          currentUser: { id: "user-b", role: "CLIENT", email: "b@email.com" },
          existingGoogleLink: { userId: "user-a", role: "CLIENT", accountStatus: "ACTIVE" },
        })
      ),
      { kind: "error", code: "GOOGLE_ACCOUNT_IN_USE" }
    );
  });

  it("G12-G14 Google CLIENT-only não altera o login por senha", () => {
    assert.equal(isAllowedGoogleRole("CLIENT"), true);
    assert.equal(isAllowedGoogleRole("PARTNER"), false);
    assert.equal(isAllowedGoogleRole("ONG"), false);
    assert.equal(resolveGoogleSignupRole("PARTNER"), "CLIENT");
  });

  it("reuses canonical client legal URLs", () => {
    assert.equal(CLIENT_LEGAL.terms.href, "/legal/cliente/termos");
    assert.equal(CLIENT_LEGAL.privacy.href, "/legal/cliente/privacidade");
  });

  it("refuses unlink of the last auth method", () => {
    assert.equal(canUnlinkGoogle({ hasPassword: false, googleLinked: true }), false);
    assert.equal(canUnlinkGoogle({ hasPassword: true, googleLinked: true }), true);
    assert.equal(canUnlinkGoogle({ hasPassword: true, googleLinked: false }), false);
  });
});
