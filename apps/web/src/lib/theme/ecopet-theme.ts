/** Temas de aparência EccoPet — única fonte de verdade (next-themes + a11y). */
export const ECOPET_THEME_STORAGE_KEY = "ecopet-theme";

export const ECOPET_APPEARANCE_THEMES = ["light", "dark", "black"] as const;
export type EcopetAppearanceTheme = (typeof ECOPET_APPEARANCE_THEMES)[number];

export const ECOPET_THEMES = [...ECOPET_APPEARANCE_THEMES, "system"] as const;
export type EcopetTheme = (typeof ECOPET_THEMES)[number];

export function isEcopetAppearanceTheme(value: string | undefined): value is EcopetAppearanceTheme {
  return ECOPET_APPEARANCE_THEMES.includes(value as EcopetAppearanceTheme);
}

/** Ciclo header: claro → escuro → preto → claro */
export function cycleAppearanceTheme(resolved: string | undefined): EcopetAppearanceTheme {
  if (resolved === "light") return "dark";
  if (resolved === "dark") return "black";
  return "light";
}

export function appearanceThemeLabelKey(
  theme: EcopetAppearanceTheme
): "a11y.themeLight" | "a11y.themeDark" | "a11y.themeBlack" {
  if (theme === "dark") return "a11y.themeDark";
  if (theme === "black") return "a11y.themeBlack";
  return "a11y.themeLight";
}

export function appearanceThemeActivatedKey(
  theme: EcopetAppearanceTheme
): "a11y.themeLightActivated" | "a11y.themeDarkActivated" | "a11y.themeBlackActivated" {
  if (theme === "dark") return "a11y.themeDarkActivated";
  if (theme === "black") return "a11y.themeBlackActivated";
  return "a11y.themeLightActivated";
}
