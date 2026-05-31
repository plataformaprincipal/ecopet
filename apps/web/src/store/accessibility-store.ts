import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  A11Y_STORAGE_KEY,
  DEFAULT_PREFERENCES,
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  SPACING_MAX,
  SPACING_MIN,
  SPACING_STEP,
  type AccessibilityPreferences,
  type Locale,
} from "@/lib/accessibility/types";

type BooleanKey = {
  [K in keyof AccessibilityPreferences]: AccessibilityPreferences[K] extends boolean ? K : never;
}[keyof AccessibilityPreferences];

interface AccessibilityState extends AccessibilityPreferences {
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  increaseLetterSpacing: () => void;
  decreaseLetterSpacing: () => void;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  toggle: (key: BooleanKey) => void;
  setLocale: (locale: Locale) => void;
  reset: () => void;
  hasActiveSettings: () => boolean;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      increaseFont: () =>
        set({ fontScale: Math.min(FONT_SCALE_MAX, get().fontScale + FONT_SCALE_STEP) }),
      decreaseFont: () =>
        set({ fontScale: Math.max(FONT_SCALE_MIN, get().fontScale - FONT_SCALE_STEP) }),
      resetFont: () => set({ fontScale: FONT_SCALE_DEFAULT, letterSpacing: 0, lineHeight: 0 }),
      increaseLetterSpacing: () =>
        set({ letterSpacing: Math.min(SPACING_MAX, get().letterSpacing + SPACING_STEP) }),
      decreaseLetterSpacing: () =>
        set({ letterSpacing: Math.max(SPACING_MIN, get().letterSpacing - SPACING_STEP) }),
      increaseLineHeight: () =>
        set({ lineHeight: Math.min(SPACING_MAX, get().lineHeight + SPACING_STEP) }),
      decreaseLineHeight: () =>
        set({ lineHeight: Math.max(SPACING_MIN, get().lineHeight - SPACING_STEP) }),
      toggle: (key) => set({ [key]: !get()[key] } as Partial<AccessibilityPreferences>),
      setLocale: (locale) => set({ locale }),
      reset: () => set({ ...DEFAULT_PREFERENCES }),
      hasActiveSettings: () => {
        const s = get();
        return (Object.keys(DEFAULT_PREFERENCES) as (keyof AccessibilityPreferences)[]).some(
          (k) => s[k] !== DEFAULT_PREFERENCES[k]
        );
      },
    }),
    { name: A11Y_STORAGE_KEY }
  )
);

// Re-export constants for components
export {
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
  FONT_SCALE_DEFAULT,
} from "@/lib/accessibility/types";
