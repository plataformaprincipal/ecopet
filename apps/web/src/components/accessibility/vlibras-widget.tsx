"use client";



import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { useAccessibilityStore } from "@/store/accessibility-store";

import {

  ensureVLibras,

  hideVLibras,

  resetVLibrasWidget,

  VW_ACTIVE_CLASS,

  VW_ROOT_ID,

} from "@/lib/accessibility/vlibras-loader";



/** Monta a estrutura HTML oficial uma única vez (imperativo) para o plugin gov.br não perder referências. */

function ensureOfficialDom(root: HTMLElement): void {

  if (root.dataset.vlibrasBuilt === "1") return;



  root.id = VW_ROOT_ID;

  root.setAttribute("vw", "");

  root.classList.add("enabled");



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



/**

 * Estrutura HTML oficial VLibras (gov.br) — montada no body via portal.

 * Script: https://vlibras.gov.br/app/vlibras-plugin.js

 * Widget: new window.VLibras.Widget("https://vlibras.gov.br/app")

 */

export function VLibrasWidget() {

  const enabled = useAccessibilityStore((s) => s.librasEnabled);

  const setStatus = useAccessibilityStore((s) => s.setVlibrasStatus);

  const rootRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);



  useEffect(() => setMounted(true), []);



  useEffect(() => {

    if (!mounted || !rootRef.current) return;

    ensureOfficialDom(rootRef.current);

  }, [mounted]);



  useEffect(() => {

    if (!mounted || typeof window === "undefined") return;



    if (!enabled) {

      hideVLibras();

      setStatus("idle");

      return;

    }



    if (rootRef.current) {

      ensureOfficialDom(rootRef.current);

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

  }, [enabled, mounted, setStatus]);



  useEffect(() => {

    return () => {

      resetVLibrasWidget();

    };

  }, []);



  if (!mounted) return null;



  return createPortal(

    <div

      ref={rootRef}

      className={cn("enabled", enabled && VW_ACTIVE_CLASS)}

      aria-hidden={!enabled}

      suppressHydrationWarning

    />,

    document.body

  );

}


