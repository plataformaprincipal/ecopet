/**
 * ECOPET Design System — TypeScript token reference (Etapa 1).
 * Source of truth for runtime CSS: apps/web/src/styles/tokens.css
 */

export const brandColors = {
  green50: "#ecfdf3",
  green100: "#d1fae5",
  green500: "#16a34a",
  green600: "#128a3f",
  green700: "#0f6f34",
  green800: "#0a4f26",
  green900: "#003b16",
  white: "#ffffff",
  graphite: "#1a221c",
  gray: "#4a5560",
  accentGold: "#c9a227",
} as const;

export const semanticColors = {
  success: "#15803d",
  warning: "#b45309",
  danger: "#dc2626",
  info: "#2563eb",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  full: "9999px",
} as const;

export const motion = {
  durationFast: "120ms",
  durationNormal: "200ms",
  durationSlow: "320ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  easingEmphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
} as const;

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  nav: 20,
  button: 18,
  status: 16,
} as const;

/** Prefer lucide-react outline icons at strokeWidth 2 */
export const iconography = {
  library: "lucide-react",
  defaultStrokeWidth: 2,
  sizes: iconSizes,
} as const;
