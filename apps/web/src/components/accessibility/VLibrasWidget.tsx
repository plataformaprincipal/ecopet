"use client";

import Script from "next/script";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { VLIBRAS_SCRIPT_URL } from "@/lib/accessibility/constants";
import {
  hideVLibras,
  initVLibras,
  setVLibrasVisible,
  VW_HIDDEN_CLASS,
} from "@/lib/accessibility/vlibras-loader";

/** DOM oficial gov.br — um único container [vw]. */
function VLibrasOfficialDom({ visible }: { visible: boolean }) {
  return (
    <div
      vw=""
      className={cn("enabled", !visible && VW_HIDDEN_CLASS)}
      aria-hidden={visible ? "false" : "true"}
      suppressHydrationWarning
    >
      <div vw-access-button="" className="active" />
      <div vw-plugin-wrapper="">
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}

export function VLibrasWidget() {
  const librasEnabled = useAccessibilityStore((s) => s.librasEnabled);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useLayoutEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && window.VLibras) {
      setScriptReady(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;

    if (!librasEnabled) {
      hideVLibras();
      return;
    }

    if (!scriptReady && !window.VLibras) return;

    initVLibras();
    setVLibrasVisible(true);
  }, [mounted, librasEnabled, scriptReady]);

  if (!mounted) return null;

  return (
    <>
      {librasEnabled && !scriptReady && (
        <Script
          id="vlibras-plugin"
          src={VLIBRAS_SCRIPT_URL}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}
      {createPortal(<VLibrasOfficialDom visible={librasEnabled} />, document.body)}
    </>
  );
}
