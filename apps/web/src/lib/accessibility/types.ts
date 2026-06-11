export type Locale = import("@/lib/i18n/config").LocaleCode;

export interface AccessibilityPreferences {
  fontScale: number;
  letterSpacing: number;
  lineHeight: number;
  highContrast: boolean;
  invertedContrast: boolean;
  grayscale: boolean;
  colorBlindMode: boolean;
  highlightLinks: boolean;
  strongFocus: boolean;
  largeCursor: boolean;
  readingMask: boolean;
  readingGuide: boolean;
  pauseAnimations: boolean;
  screenReaderMode: boolean;
  brailleEnabled: boolean;
  dyslexiaMode: boolean;
  calmMode: boolean;
  simplifiedUI: boolean;
  reduceVisualNotifications: boolean;
  motorMode: boolean;
  cognitiveMode: boolean;
  visualAlerts: boolean;
  librasEnabled: boolean;
  locale: Locale;
}

export const FONT_SCALE_MIN = 0.875;
export const FONT_SCALE_MAX = 1.75;
export const FONT_SCALE_STEP = 0.125;
export const FONT_SCALE_DEFAULT = 1;

export const SPACING_MIN = 0;
export const SPACING_MAX = 3;
export const SPACING_STEP = 1;

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontScale: FONT_SCALE_DEFAULT,
  letterSpacing: 0,
  lineHeight: 0,
  highContrast: false,
  invertedContrast: false,
  grayscale: false,
  colorBlindMode: false,
  highlightLinks: false,
  strongFocus: false,
  largeCursor: false,
  readingMask: false,
  readingGuide: false,
  pauseAnimations: false,
  screenReaderMode: false,
  brailleEnabled: false,
  dyslexiaMode: false,
  calmMode: false,
  simplifiedUI: false,
  reduceVisualNotifications: false,
  motorMode: false,
  cognitiveMode: false,
  visualAlerts: false,
  librasEnabled: false,
  locale: "pt-BR",
};

export const A11Y_STORAGE_KEY = "ecopet-a11y-v2";
