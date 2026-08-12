import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { translateApiAuthError } from "@/lib/i18n/auth-translations";

describe("turnstile auth i18n", () => {
  it("maps TURNSTILE_REQUIRED to incomplete message key via translator", () => {
    const t = (key: string) => `translated:${key}`;
    const out = translateApiAuthError(
      "Verificação necessária. Conclua o desafio para continuar.",
      "TURNSTILE_REQUIRED",
      t as never
    );
    assert.equal(out, "translated:turnstile.incomplete");
  });

  it("never returns raw English Verification required for failed codes", () => {
    const t = (key: string) => {
      if (key === "turnstile.failed") return "We could not complete the security verification. Please try again.";
      if (key === "turnstile.incomplete") {
        return "We could not complete the security verification. Please try again.";
      }
      return key;
    };
    const out = translateApiAuthError("Não foi possível verificar. Tente novamente.", "TURNSTILE_FAILED", t as never);
    assert.match(out, /security verification/i);
    assert.doesNotMatch(out, /^Verification required$/i);
  });
});
