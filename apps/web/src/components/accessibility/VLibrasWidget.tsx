"use client";

import Script from "next/script";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { VLIBRAS_SCRIPT_URL } from "@/lib/accessibility/constants";
import {
  activateVLibras,
  deactivateVLibras,
  syncVLibrasBodyClass,
  VW_DISABLED_CLASS,
  VW_HIDDEN_CLASS,
} from "@/lib/accessibility/vlibras-loader";

/** DOM oficial gov.br — um único container [vw], sempre montado. */
function VLibrasOfficialDom({ visible }: { visible: boolean }) {
  return (
    <div
      vw=""
      className={cn("enabled", !visible && VW_HIDDEN_CLASS, !visible && VW_DISABLED_CLASS)}
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
  const setVlibrasStatus = useAccessibilityStore((s) => s.setVlibrasStatus);
  const [mounted, setMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptRequested, setScriptRequested] = useState(false);
  const lastSyncedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && window.VLibras) {
      setScriptReady(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (librasEnabled) setScriptRequested(true);
  }, [librasEnabled]);

  useLayoutEffect(() => {
    if (!mounted) return;
    syncVLibrasBodyClass(librasEnabled);

    if (!librasEnabled) {
      if (lastSyncedRef.current !== false) {
        deactivateVLibras();
        setVlibrasStatus("idle");
        lastSyncedRef.current = false;
      }
      return;
    }

    if (!scriptReady && !window.VLibras) {
      setVlibrasStatus("loading");
      return;
    }

    if (lastSyncedRef.current !== true) {
      const ok = activateVLibras();
      setVlibrasStatus(ok ? "ready" : "error");
      lastSyncedRef.current = true;
    }
  }, [mounted, librasEnabled, scriptReady, setVlibrasStatus]);

  if (!mounted) return null;

  return (
    <>
      {scriptRequested && !scriptReady && (
        <Script
          id="vlibras-plugin"
          src={VLIBRAS_SCRIPT_URL}
          strategy="afterInteractive"
          onLoad={() => {
            setScriptReady(true);
            if (librasEnabled) {
              const ok = activateVLibras();
              useAccessibilityStore.getState().setVlibrasStatus(ok ? "ready" : "error");
              lastSyncedRef.current = true;
            }
          }}
        />
      )}
      {createPortal(<VLibrasOfficialDom visible={librasEnabled} />, document.body)}
    </>
  );
}
