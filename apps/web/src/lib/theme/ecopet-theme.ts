/** Temas de aparência EccoPet — única fonte de verdade (next-themes + a11y). */
export const ECOPET_THEME_STORAGE_KEY = "ecopet-theme";

export const ECOPET_APPEARANCE_THEMES = ["light", "dark"] as const;
export type EcopetAppearanceTheme = (typeof ECOPET_APPEARANCE_THEMES)[number];

export const ECOPET_THEMES = [...ECOPET_APPEARANCE_THEMES, "system"] as const;
export type EcopetTheme = (typeof ECOPET_THEMES)[number];

/** Preferência antiga `black` cai em `dark` — nunca em tema inválido. */
export function normalizeAppearanceTheme(value: string | undefined | null): EcopetAppearanceTheme {
  if (value === "dark" || value === "black") return "dark";
  return "light";
}

export function isEcopetAppearanceTheme(value: string | undefined): value is EcopetAppearanceTheme {
  return ECOPET_APPEARANCE_THEMES.includes(value as EcopetAppearanceTheme);
}

/** Ciclo header: claro ↔ escuro */
export function cycleAppearanceTheme(resolved: string | undefined): EcopetAppearanceTheme {
  return normalizeAppearanceTheme(resolved) === "light" ? "dark" : "light";
}

export function appearanceThemeLabelKey(
  theme: EcopetAppearanceTheme
): "a11y.themeLight" | "a11y.themeDark" {
  return theme === "dark" ? "a11y.themeDark" : "a11y.themeLight";
}

export function appearanceThemeActivatedKey(
  theme: EcopetAppearanceTheme
): "a11y.themeLightActivated" | "a11y.themeDarkActivated" {
  return theme === "dark" ? "a11y.themeDarkActivated" : "a11y.themeLightActivated";
}
