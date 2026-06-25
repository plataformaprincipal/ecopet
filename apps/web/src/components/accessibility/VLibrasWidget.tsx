"use client";



import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { useAccessibilityStore } from "@/store/accessibility-store";

import {

  ensureVLibras,

  hideVLibras,

  isVLibrasAvatarVisible,

  isVLibrasLoadReady,

  notifyVLibrasRouteChange,

  setVLibrasVisible,

  VW_HIDDEN_CLASS,

  VW_ROOT_ID,

} from "@/lib/accessibility/vlibras-loader";

import { VLIBRAS_TOTAL_LOAD_TIMEOUT_MS } from "@/lib/accessibility/constants";



const IS_DEV = process.env.NODE_ENV === "development";



function VLibrasOfficialDom({ visible }: { visible: boolean }) {

  return (

    <div

      id={VW_ROOT_ID}

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

  const vlibrasStatus = useAccessibilityStore((s) => s.vlibrasStatus);

  const setStatus = useAccessibilityStore((s) => s.setVlibrasStatus);

  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  const loadGeneration = useRef(0);



  useEffect(() => setMounted(true), []);



  useEffect(() => {

    if (!mounted || typeof window === "undefined") return;



    if (!librasEnabled) {

      hideVLibras();

      setStatus("idle");

      return;

    }



    const generation = ++loadGeneration.current;

    setStatus("loading");



    const watchdog = setTimeout(() => {

      if (loadGeneration.current !== generation) return;

      if (useAccessibilityStore.getState().vlibrasStatus !== "loading") return;

      if (IS_DEV) {

        console.warn("[VLIBRAS] Timeout — serviço externo indisponível");

      }

      hideVLibras();

      setStatus("unavailable");

    }, VLIBRAS_TOTAL_LOAD_TIMEOUT_MS + 500);



    const run = async () => {

      try {

        if (isVLibrasAvatarVisible()) {

          if (loadGeneration.current === generation) {

            setVLibrasVisible(true);

            setStatus("ready");

          }

          return;

        }



        const outcome = await ensureVLibras();

        if (loadGeneration.current !== generation) return;



        if (isVLibrasLoadReady(outcome)) {

          setVLibrasVisible(true);

          setStatus("ready");

          return;

        }



        hideVLibras();

        setStatus("unavailable");

        if (IS_DEV) {

          console.warn("[VLIBRAS] Indisponível — script ou avatar não carregou", outcome);

        }

      } catch {

        hideVLibras();

        if (loadGeneration.current === generation) {

          setStatus("unavailable");

        }

        if (IS_DEV) {

          console.warn("[VLIBRAS] Falha inesperada capturada — app continua normalmente");

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



  useEffect(() => {

    if (!mounted || !librasEnabled || vlibrasStatus !== "ready") return;

    notifyVLibrasRouteChange();

  }, [pathname, mounted, librasEnabled, vlibrasStatus]);



  if (!mounted) return null;

  const domVisible =
    librasEnabled && vlibrasStatus !== "unavailable" && vlibrasStatus !== "error";

  return createPortal(<VLibrasOfficialDom visible={domVisible} />, document.body);
}


