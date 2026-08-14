"use client";

import { useAccessibilityStore } from "@/store/accessibility-store";
import { simplifyText } from "@/lib/accessibility/simple-language";

/** Retorna texto simplificado quando o modo cognitivo/linguagem simples está ativo. */
export function useSimpleLanguage() {
  const enabled = useAccessibilityStore((s) => s.cognitiveMode);
  return {
    enabled,
    s: (text: string) => simplifyText(text, enabled),
  };
}
