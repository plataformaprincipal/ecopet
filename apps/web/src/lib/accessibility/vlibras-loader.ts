import { VLIBRAS_SCRIPT_URL, VLIBRAS_WIDGET_URL } from "./constants";



declare global {

  interface Window {

    VLibras?: {

      Widget: new (url: string) => VLibrasWidgetInstance;

    };

  }

}



export type VLibrasWidgetInstance = {

  destroy?: () => void;

};



let scriptPromise: Promise<void> | null = null;

let widgetInstance: VLibrasWidgetInstance | null = null;

let onloadTriggered = false;



const SCRIPT_ID = "ecopet-vlibras-plugin";

export const VW_ROOT_ID = "ecopet-vlibras-root";

export const VW_ACTIVE_CLASS = "ecopet-vlibras-active";



/** Retorna o container oficial `[vw]` montado pelo VLibrasWidget. */

export function getVLibrasRoot(): HTMLElement | null {

  if (typeof document === "undefined") return null;

  return (

    document.getElementById(VW_ROOT_ID) ??

    (document.querySelector("[vw]") as HTMLElement | null)

  );

}



/** Exibe ou oculta o avatar oficial sem remover o DOM. */

export function setVLibrasVisible(visible: boolean): void {

  const el = getVLibrasRoot();

  if (!el) return;

  el.classList.toggle(VW_ACTIVE_CLASS, visible);

  el.setAttribute("aria-hidden", visible ? "false" : "true");

}



function isAccessButtonReady(): boolean {

  const btn = document.querySelector("[vw-access-button]");

  return Boolean(btn?.querySelector(".vp-access-button, img[data-src], img[src]"));

}



/**

 * O plugin gov.br registra a injeção do avatar em `window.onload`.

 * Em SPA (Next.js) o onload já ocorreu — é preciso dispará-lo manualmente após `new Widget`.

 */

function triggerVLibrasOnloadIfNeeded(): void {

  if (onloadTriggered || isAccessButtonReady()) return;

  if (document.readyState !== "complete") return;

  const handler = window.onload;

  if (typeof handler !== "function") return;

  onloadTriggered = true;

  handler.call(window, new Event("load"));

}



function waitForVLibrasGlobal(): Promise<void> {

  return new Promise((resolve, reject) => {

    if (typeof window !== "undefined" && window.VLibras) {

      resolve();

      return;

    }

    let attempts = 0;

    const tick = () => {

      if (window.VLibras) {

        resolve();

        return;

      }

      if (++attempts > 150) {

        reject(new Error("VLibras global not available"));

        return;

      }

      requestAnimationFrame(tick);

    };

    tick();

  });

}



function waitForAccessButton(): Promise<void> {

  return new Promise((resolve, reject) => {

    let attempts = 0;

    const tick = () => {

      const btn = document.querySelector("[vw-access-button]") as HTMLElement | null;

      const root = getVLibrasRoot();

      if (btn && root?.classList.contains(VW_ACTIVE_CLASS) && isAccessButtonReady()) {

        const rect = btn.getBoundingClientRect();

        const style = getComputedStyle(btn);

        const inViewport =

          rect.width >= 32 &&

          rect.height >= 32 &&

          rect.bottom > 0 &&

          rect.top < window.innerHeight &&

          rect.right > 0 &&

          rect.left < window.innerWidth;

        const fixed = style.position === "fixed";

        if (inViewport || (fixed && rect.width >= 32 && rect.height >= 32)) {

          resolve();

          return;

        }

      }

      if (++attempts > 250) {

        reject(new Error("VLibras access button not visible"));

        return;

      }

      requestAnimationFrame(tick);

    };

    tick();

  });

}



function initWidget(): void {

  if (typeof window === "undefined") return;

  if (widgetInstance) {

    triggerVLibrasOnloadIfNeeded();

    return;

  }

  if (!window.VLibras) return;



  const root = getVLibrasRoot();

  if (!root) {

    throw new Error("VLibras container [vw] not found");

  }



  setVLibrasVisible(true);



  widgetInstance = new window.VLibras.Widget(VLIBRAS_WIDGET_URL);

  triggerVLibrasOnloadIfNeeded();

}



function loadScriptOnce(): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  if (widgetInstance && isAccessButtonReady()) return Promise.resolve();

  if (scriptPromise) return scriptPromise;



  scriptPromise = new Promise((resolve, reject) => {

    const finish = () => {

      waitForVLibrasGlobal()

        .then(() => {

          try {

            initWidget();

            resolve();

          } catch (err) {

            scriptPromise = null;

            reject(err);

          }

        })

        .catch((err) => {

          scriptPromise = null;

          reject(err);

        });

    };



    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {

      if (window.VLibras) {

        finish();

      } else {

        existing.addEventListener("load", finish, { once: true });

        existing.addEventListener(

          "error",

          () => {

            scriptPromise = null;

            reject(new Error("VLibras script failed"));

          },

          { once: true }

        );

      }

      return;

    }



    const script = document.createElement("script");

    script.id = SCRIPT_ID;

    script.src = VLIBRAS_SCRIPT_URL;

    script.async = true;

    script.onload = finish;

    script.onerror = () => {

      scriptPromise = null;

      reject(new Error("VLibras script failed"));

    };

    document.body.appendChild(script);

  });



  return scriptPromise;

}



/**

 * Carrega script oficial, garante DOM `[vw]` e inicializa Widget — uma instância por sessão.

 * Deve ser chamado apenas no navegador (useEffect / evento do painel).

 */

export async function ensureVLibras(): Promise<void> {

  if (typeof window === "undefined") return;



  const root = getVLibrasRoot();

  if (!root) {

    throw new Error("VLibras container not mounted");

  }



  setVLibrasVisible(true);



  if (widgetInstance && isAccessButtonReady()) {

    await waitForAccessButton();

    return;

  }



  await loadScriptOnce();

  triggerVLibrasOnloadIfNeeded();

  await waitForAccessButton();

}



export function hideVLibras(): void {

  setVLibrasVisible(false);

}



export function isVLibrasReady(): boolean {

  return widgetInstance !== null && isAccessButtonReady();

}



export function resetVLibrasWidget(): void {

  widgetInstance?.destroy?.();

  widgetInstance = null;

  scriptPromise = null;

  onloadTriggered = false;

}


