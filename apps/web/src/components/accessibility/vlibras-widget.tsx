"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { ensureVLibras } from "@/lib/accessibility/vlibras-loader";

function mountOfficialStructure(container: HTMLElement) {
  if (container.querySelector("[vw]")) return;

  const root = document.createElement("div");
  root.setAttribute("vw", "");
  root.className = "enabled";

  const accessBtn = document.createElement("div");
  accessBtn.setAttribute("vw-access-button", "");
  accessBtn.className = "active";

  const pluginWrapper = document.createElement("div");
  pluginWrapper.setAttribute("vw-plugin-wrapper", "");

  const topWrapper = document.createElement("div");
  topWrapper.className = "vw-plugin-top-wrapper";
  pluginWrapper.appendChild(topWrapper);

  root.appendChild(accessBtn);
  root.appendChild(pluginWrapper);
  container.appendChild(root);
}

/**
 * Widget VLibras (gov.br) — controlado exclusivamente por `librasEnabled`
 * no painel de acessibilidade ECOPET. O avatar flutuante é o botão oficial do VLibras.
 */
export function VLibrasWidget() {
  const enabled = useAccessibilityStore((s) => s.librasEnabled);
  const setStatus = useAccessibilityStore((s) => s.setVlibrasStatus);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated || !containerRef.current) return;
    mountOfficialStructure(containerRef.current);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (!enabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    ensureVLibras()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err: unknown) => {
        console.error("[ECOPET VLibras]", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, setStatus]);

  if (!hydrated) return null;

  return (
    <div
      ref={containerRef}
      id="vlibras-root"
      className={cn("a11y-vlibras-slot", !enabled && "a11y-vlibras-hidden")}
      role="complementary"
      aria-label="Tradutor VLibras"
      aria-hidden={!enabled}
      suppressHydrationWarning
    />
  );
}
