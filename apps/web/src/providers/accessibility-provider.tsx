"use client";

import { useEffect } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { DEFAULT_PREFERENCES } from "@/lib/accessibility/types";
import type { AccessibilityPreferences } from "@/lib/accessibility/types";
import { ReadingAssist } from "@/components/accessibility/reading-assist";
import { VLibrasWidget } from "@/components/accessibility/vlibras-widget";
import { BraillePanel } from "@/components/accessibility/braille-panel";

const CLASS_MAP: Record<string, keyof AccessibilityPreferences> = {
  "a11y-high-contrast": "highContrast",
  "a11y-inverted-contrast": "invertedContrast",
  "a11y-grayscale": "grayscale",
  "a11y-colorblind": "colorBlindMode",
  "a11y-highlight-links": "highlightLinks",
  "a11y-strong-focus": "strongFocus",
  "a11y-large-cursor": "largeCursor",
  "a11y-pause-animations": "pauseAnimations",
  "a11y-screen-reader": "screenReaderMode",
  "a11y-dyslexia": "dyslexiaMode",
  "a11y-calm": "calmMode",
  "a11y-simplified": "simplifiedUI",
  "a11y-reduce-notifications": "reduceVisualNotifications",
  "a11y-motor": "motorMode",
  "a11y-cognitive": "cognitiveMode",
  "a11y-visual-alerts": "visualAlerts",
};

function applyPreferences(prefs: AccessibilityPreferences) {
  const root = document.documentElement;

  root.style.setProperty("--a11y-font-scale", String(prefs.fontScale));
  root.style.setProperty("--a11y-letter-spacing", String(prefs.letterSpacing));
  root.style.setProperty("--a11y-line-height", String(prefs.lineHeight));
  root.lang = prefs.locale;

  Object.entries(CLASS_MAP).forEach(([className, key]) => {
    root.classList.toggle(className, Boolean(prefs[key]));
  });

  const pauseAnim = prefs.pauseAnimations || prefs.dyslexiaMode || prefs.calmMode;
  root.classList.toggle("a11y-pause-animations", pauseAnim);
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyPreferences(useAccessibilityStore.getState());
    return useAccessibilityStore.subscribe((state) => applyPreferences(state));
  }, []);

  return (
    <>
      {children}
      <ReadingAssist />
      <VLibrasWidget />
      <BraillePanel />
    </>
  );
}

export { DEFAULT_PREFERENCES };
