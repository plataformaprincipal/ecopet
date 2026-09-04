import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cycleThemePreference, normalizeAppearanceTheme } from "./ecopet-theme";

describe("ecopet-theme", () => {
  it("cycles light → dark → system → light", () => {
    assert.equal(cycleThemePreference("light"), "dark");
    assert.equal(cycleThemePreference("dark"), "system");
    assert.equal(cycleThemePreference("system"), "light");
  });

  it("normalizes legacy black to dark", () => {
    assert.equal(normalizeAppearanceTheme("black"), "dark");
    assert.equal(normalizeAppearanceTheme("dark"), "dark");
    assert.equal(normalizeAppearanceTheme("light"), "light");
  });
});
