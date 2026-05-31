"use client";

import { useEffect, useRef } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { VLIBRAS_SCRIPT_URL, VLIBRAS_WIDGET_URL } from "@/lib/accessibility/constants";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => void };
  }
}

function isOfficialVlibrasUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "vlibras.gov.br" && parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Integração VLibras (gov.br) — carregada sob demanda, somente domínio oficial.
 * Documentação: https://www.gov.br/governodigital/pt-br/vlibras
 */
export function VLibrasWidget() {
  const enabled = useAccessibilityStore((s) => s.librasEnabled);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    if (!isOfficialVlibrasUrl(VLIBRAS_SCRIPT_URL) || !isOfficialVlibrasUrl(VLIBRAS_WIDGET_URL)) return;

    const container = document.getElementById("vlibras-root");
    if (!container) return;

    container.innerHTML = `
      <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
      </div>
    `;

    const script = document.createElement("script");
    script.src = VLIBRAS_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer-when-downgrade";
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget(VLIBRAS_WIDGET_URL);
        loaded.current = true;
      }
    };
    script.onerror = () => {
      container.setAttribute("data-a11y-alert", "true");
      container.innerHTML =
        '<p style="padding:8px;background:#1a3a2a;color:#fff;border-radius:8px;font-size:12px">VLibras indisponível. Verifique sua conexão.</p>';
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
      loaded.current = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      id="vlibras-root"
      className="a11y-vlibras-slot"
      role="complementary"
      aria-label="Tradutor de Libras VLibras"
    />
  );
}
