"use client";

import { useEffect } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";

const ENHANCED = "data-ecopet-braille-enhanced";

/** Melhorias leves de semântica para leitores de tela / linhas Braille. */
function enhancePageForBraille(root: HTMLElement) {
  root.querySelectorAll("button:not([aria-label]):not([aria-labelledby])").forEach((el) => {
    if (el.hasAttribute(ENHANCED)) return;
    const text = el.textContent?.trim();
    if (!text && el.querySelector("svg, img")) {
      el.setAttribute("aria-label", "Botão");
    }
    el.setAttribute(ENHANCED, "true");
  });

  root.querySelectorAll("img:not([alt])").forEach((el) => {
    if (el.hasAttribute(ENHANCED)) return;
    el.setAttribute("alt", "");
    el.setAttribute(ENHANCED, "true");
  });

  root.querySelectorAll("svg:not([aria-hidden])").forEach((el) => {
    const parent = el.closest("button, a, [role='button']");
    if (!parent && !el.getAttribute("aria-label")) {
      el.setAttribute("aria-hidden", "true");
      el.setAttribute(ENHANCED, "true");
    }
  });
}

function cleanupEnhancements(root: HTMLElement) {
  root.querySelectorAll(`[${ENHANCED}]`).forEach((el) => {
    el.removeAttribute(ENHANCED);
  });
}

export function BrailleMode() {
  const enabled = useAccessibilityStore((s) => s.brailleEnabled);

  useEffect(() => {
    const main = document.getElementById("main-content") ?? document.body;
    if (enabled) {
      enhancePageForBraille(main);
    } else {
      cleanupEnhancements(main);
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="ecopet-braille-notice"
      role="status"
      aria-live="polite"
    >
      Modo Braille ativado: interface otimizada para leitores de tela e linhas Braille.
    </div>
  );
}
