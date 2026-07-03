import { VLIBRAS_WIDGET_URL } from "./constants";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (rootPath?: string) => unknown;
    };
  }
}

export const VW_HIDDEN_CLASS = "ecopet-vlibras-hidden";

let widgetCreated = false;
let onloadFired = false;

export function getVLibrasRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("[vw].enabled") as HTMLElement | null;
}

export function setVLibrasVisible(visible: boolean): void {
  const el = getVLibrasRoot();
  if (!el) return;
  el.classList.toggle(VW_HIDDEN_CLASS, !visible);
  el.setAttribute("aria-hidden", visible ? "false" : "true");
}

export function hideVLibras(): void {
  setVLibrasVisible(false);
}

/**
 * Integração oficial gov.br:
 * new window.VLibras.Widget('https://vlibras.gov.br/app')
 *
 * Adaptação mínima Next.js: o plugin registra window.onload para injetar o botão
 * após o DOM existir (em HTML estático isso ocorre naturalmente).
 */
export function initVLibras(): void {
  if (typeof window === "undefined" || !window.VLibras || widgetCreated) return;
  if (!getVLibrasRoot()?.querySelector("[vw-access-button]")) return;

  new window.VLibras.Widget(VLIBRAS_WIDGET_URL);
  widgetCreated = true;

  if (!onloadFired) {
    const handler = window.onload;
    if (typeof handler === "function") {
      onloadFired = true;
      handler.call(window, new Event("load"));
    }
  }
}
