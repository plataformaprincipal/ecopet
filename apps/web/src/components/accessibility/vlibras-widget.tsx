"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { VLIBRAS_SCRIPT_URL, VLIBRAS_WIDGET_URL } from "@/lib/accessibility/constants";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => void };
  }
}

export function VLibrasWidget() {
  const enabled = useAccessibilityStore((s) => s.librasEnabled);
  const setStatus = useAccessibilityStore((s) => s.setVlibrasStatus);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const container = document.getElementById("vlibras-root");
    if (!container || initialized.current) return;

    setStatus("loading");
    container.innerHTML = `
      <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
      </div>
    `;

    const script = document.createElement("script");
    script.src = VLIBRAS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget(VLIBRAS_WIDGET_URL);
        initialized.current = true;
        setStatus("ready");
      } else {
        setStatus("error");
      }
    };
    script.onerror = () => setStatus("error");
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      scriptRef.current?.remove();
      scriptRef.current = null;
      initialized.current = false;
    };
  }, [enabled, setStatus]);

  return (
    <div
      id="vlibras-root"
      className={cn("a11y-vlibras-slot", !enabled && "sr-only")}
      role="complementary"
      aria-label="Tradutor de Libras VLibras"
      aria-hidden={!enabled}
    />
  );
}
