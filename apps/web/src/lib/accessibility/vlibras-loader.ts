import { VLIBRAS_SCRIPT_URL, VLIBRAS_WIDGET_URL } from "./constants";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => VLibrasWidgetInstance;
    };
  }
}

export type VLibrasWidgetInstance = {
  /** Instância oficial — API controlada pelo gov.br */
  destroy?: () => void;
};

let scriptPromise: Promise<void> | null = null;
let widgetInstance: VLibrasWidgetInstance | null = null;

const SCRIPT_ID = "ecopet-vlibras-plugin";

function waitForContainer(): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      const el = document.getElementById("vlibras-root");
      if (el?.querySelector("[vw]")) {
        resolve(el);
        return;
      }
      if (++attempts > 40) {
        reject(new Error("VLibras container not found"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function initWidget(): void {
  if (widgetInstance || !window.VLibras) return;
  widgetInstance = new window.VLibras.Widget(VLIBRAS_WIDGET_URL);
}

function loadScriptOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (widgetInstance) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const onReady = () => {
      try {
        initWidget();
        resolve();
      } catch (err) {
        scriptPromise = null;
        reject(err);
      }
    };

    if (existing) {
      if (window.VLibras) {
        onReady();
      } else {
        existing.addEventListener("load", onReady, { once: true });
        existing.addEventListener("error", () => {
          scriptPromise = null;
          reject(new Error("VLibras script failed"));
        }, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = VLIBRAS_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = onReady;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("VLibras script failed"));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/** Carrega script e inicializa Widget — uma única instância por sessão. */
export async function ensureVLibras(): Promise<void> {
  await waitForContainer();
  await loadScriptOnce();
}

export function isVLibrasReady(): boolean {
  return widgetInstance !== null;
}
