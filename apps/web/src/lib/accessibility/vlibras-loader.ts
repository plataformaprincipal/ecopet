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
let openPanelTimer: ReturnType<typeof setTimeout> | null = null;

export function isVLibrasWidgetCreated(): boolean {
  return widgetCreated;
}

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

export function showVLibras(): void {
  setVLibrasVisible(true);
}

function clearOpenPanelTimer(): void {
  if (openPanelTimer !== null) {
    clearTimeout(openPanelTimer);
    openPanelTimer = null;
  }
}

function isVLibrasPanelOpen(): boolean {
  const wrapper = getVLibrasRoot()?.querySelector("[vw-plugin-wrapper]");
  if (!wrapper) return false;
  return Boolean(
    wrapper.querySelector("#gameContainer, .vpw-plugin-wrapper, .vp-plugin-wrapper, .vp-side-menu")
  );
}

/** Abre o painel do plugin (clique no botão oficial) sem criar nova instância. */
export function openVLibrasPanel(): void {
  const root = getVLibrasRoot();
  if (!root || root.classList.contains(VW_HIDDEN_CLASS)) return;
  if (isVLibrasPanelOpen()) return;

  const officialBtn = root.querySelector(
    "[vw-access-button] .vp-access-button, [vw-access-button] img"
  ) as HTMLElement | null;
  const accessHost = root.querySelector("[vw-access-button]") as HTMLElement | null;
  const target = officialBtn ?? accessHost;
  target?.click();
}

/** Fecha o painel do plugin se estiver aberto. */
export function closeVLibrasPanel(): void {
  if (!isVLibrasPanelOpen()) return;

  const closeBtn = document.querySelector(
    ".vp-side-menu-close, .vp-close-button, [vp-close], .vpw-close"
  ) as HTMLElement | null;
  if (closeBtn) {
    closeBtn.click();
    return;
  }

  const accessHost = getVLibrasRoot()?.querySelector("[vw-access-button]") as HTMLElement | null;
  accessHost?.click();
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

function scheduleOpenPanel(): void {
  clearOpenPanelTimer();
  openPanelTimer = setTimeout(() => {
    openPanelTimer = null;
    openVLibrasPanel();
  }, 120);
}

/** Ativa VLibras: mostra widget, garante instância única e abre o painel oficial. */
export function activateVLibras(): boolean {
  if (typeof window === "undefined" || !window.VLibras) return false;

  initVLibras();
  showVLibras();

  const accessHost = getVLibrasRoot()?.querySelector("[vw-access-button]");
  accessHost?.classList.add("active");

  const accessBtn = getVLibrasRoot()?.querySelector(
    "[vw-access-button] .vp-access-button, [vw-access-button] img"
  );
  if (accessBtn) {
    scheduleOpenPanel();
    return true;
  }

  scheduleOpenPanel();
  return widgetCreated;
}

/** Desativa VLibras: fecha painel, oculta widget e remove classes de ativo. */
export function deactivateVLibras(): void {
  clearOpenPanelTimer();
  closeVLibrasPanel();
  hideVLibras();

  const accessHost = getVLibrasRoot()?.querySelector("[vw-access-button]");
  accessHost?.classList.remove("active");
}

/** Sincroniza visibilidade do DOM com o estado do store (sem recriar Widget). */
export function syncVLibrasWithStore(enabled: boolean): void {
  if (enabled) {
    activateVLibras();
  } else {
    deactivateVLibras();
  }
}
