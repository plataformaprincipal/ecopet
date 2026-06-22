"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAccessibilityStore } from "@/store/accessibility-store";
import {
  ensureVLibras,
  hideVLibras,
  isVLibrasAvatarVisible,
  isVLibrasLoadReady,
  setVLibrasVisible,
  VW_ACTIVE_CLASS,
  VW_ROOT_ID,
} from "@/lib/accessibility/vlibras-loader";
import { VLIBRAS_TOTAL_LOAD_TIMEOUT_MS } from "@/lib/accessibility/constants";

function ensureOfficialDom(root: HTMLElement): void {
  if (root.dataset.vlibrasBuilt === "1") return;

  root.id = VW_ROOT_ID;
  root.setAttribute("vw", "");
  root.classList.add("enabled", "vlibras-widget");
  root.replaceChildren();

  const accessBtn = document.createElement("div");
  accessBtn.setAttribute("vw-access-button", "");
  accessBtn.classList.add("active");

  const pluginWrapper = document.createElement("div");
  pluginWrapper.setAttribute("vw-plugin-wrapper", "");

  const topWrapper = document.createElement("div");
  topWrapper.classList.add("vw-plugin-top-wrapper");
  pluginWrapper.appendChild(topWrapper);

  root.append(accessBtn, pluginWrapper);
  root.dataset.vlibrasBuilt = "1";
}

export function VLibrasWidget() {
  const librasEnabled = useAccessibilityStore((s) => s.librasEnabled);
  const setStatus = useAccessibilityStore((s) => s.setVlibrasStatus);
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const loadGeneration = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !rootRef.current) return;
    ensureOfficialDom(rootRef.current);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    if (!librasEnabled) {
      hideVLibras();
      setStatus("idle");
      return;
    }

    const generation = ++loadGeneration.current;

    if (rootRef.current) {
      ensureOfficialDom(rootRef.current);
    }

    setVLibrasVisible(true);
    setStatus("loading");

    const watchdog = setTimeout(() => {
      if (loadGeneration.current !== generation) return;
      const status = useAccessibilityStore.getState().vlibrasStatus;
      if (status !== "loading") return;
      console.log("[VLIBRAS] Timeout", "watchdog UI — forçando unavailable");
      hideVLibras();
      setStatus("unavailable");
    }, VLIBRAS_TOTAL_LOAD_TIMEOUT_MS + 500);

    const run = async () => {
      try {
        if (isVLibrasAvatarVisible()) {
          if (loadGeneration.current === generation) {
            setStatus("ready");
          }
          return;
        }

        const outcome = await ensureVLibras();

        if (loadGeneration.current !== generation) return;

        if (isVLibrasLoadReady(outcome) && isVLibrasAvatarVisible()) {
          setStatus("ready");
          return;
        }

        hideVLibras();
        setStatus("unavailable");
      } catch (err) {
        console.log("[VLIBRAS] Erro de carregamento", err);
        if (loadGeneration.current === generation) {
          hideVLibras();
          setStatus("unavailable");
        }
      } finally {
        if (loadGeneration.current === generation) {
          clearTimeout(watchdog);
        }
      }
    };

    void run();

    return () => {
      clearTimeout(watchdog);
    };
  }, [librasEnabled, mounted, setStatus]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className={cn("enabled", "vlibras-widget", librasEnabled && VW_ACTIVE_CLASS)}
      aria-hidden={!librasEnabled}
      suppressHydrationWarning
    />,
    document.body
  );
}
