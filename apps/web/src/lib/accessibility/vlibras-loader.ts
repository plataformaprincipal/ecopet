import { VLIBRAS_WIDGET_URL } from "./constants";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (rootPath?: string) => unknown;
    };
  }
}

export const VW_HIDDEN_CLASS = "ecopet-vlibras-hidden";
export const VW_DISABLED_CLASS = "ecopet-vlibras-disabled";
export const VW_BODY_INACTIVE_CLASS = "ecopet-vlibras-inactive";

let widgetCreated = false;
let onloadFired = false;
let openPanelTimer: ReturnType<typeof setTimeout> | null = null;

export function isVLibrasWidgetCreated(): boolean {
  return widgetCreated;
}

export function getVLibrasRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("[vw]") as HTMLElement | null;
}

function setBodyInactive(inactive: boolean): void {
  if (typeof document === "undefined") return;
  document.body.classList.toggle(VW_BODY_INACTIVE_CLASS, inactive);
}

/** Oculta overlays Unity (ex.: tooltip "Interagir") que ficam acima do painel EcoPet. */
function hideInteractOverlays(): void {
  if (typeof document === "undefined") return;

  const root = getVLibrasRoot();
  const scope = root ?? document.body;

  scope.querySelectorAll<HTMLElement>("#gameContainer, #unity-container, #unity-footer, canvas").forEach((el) => {
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
  });

  scope.querySelectorAll<HTMLElement>("div, span, button, p, label").forEach((el) => {
    const text = el.textContent?.trim();
    if (!text || !/interagir/i.test(text)) return;
    const host = el.closest("[vw], [vw-plugin-wrapper], #gameContainer") ?? el;
    if (!(host instanceof HTMLElement)) return;
    host.style.setProperty("pointer-events", "none", "important");
    host.style.setProperty("visibility", "hidden", "important");
    host.style.setProperty("opacity", "0", "important");
    host.style.setProperty("z-index", "-1", "important");
  });
}

function clearInteractOverlayStyles(): void {
  if (typeof document === "undefined") return;
  const root = getVLibrasRoot();
  if (!root) return;

  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    if (
      el.style.pointerEvents === "none" &&
      el.style.visibility === "hidden"
    ) {
      el.style.removeProperty("pointer-events");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.style.removeProperty("z-index");
    }
  });
}

export function setVLibrasVisible(visible: boolean): void {
  const el = getVLibrasRoot();
  if (!el) return;

  el.classList.toggle(VW_HIDDEN_CLASS, !visible);
  el.classList.toggle(VW_DISABLED_CLASS, !visible);
  el.classList.toggle("enabled", visible);

  el.setAttribute("aria-hidden", visible ? "false" : "true");
  setBodyInactive(!visible);

  if (visible) {
    clearInteractOverlayStyles();
  } else {
    hideInteractOverlays();
  }
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
  if (!root || root.classList.contains(VW_HIDDEN_CLASS) || root.classList.contains(VW_DISABLED_CLASS)) {
    return;
  }
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

/** Desativa VLibras: fecha painel, oculta widget e bloqueia cliques/overlays. */
export function deactivateVLibras(): void {
  clearOpenPanelTimer();
  closeVLibrasPanel();
  hideVLibras();

  const accessHost = getVLibrasRoot()?.querySelector("[vw-access-button]");
  accessHost?.classList.remove("active");
  hideInteractOverlays();
}

/** Sincroniza visibilidade do DOM com o estado do store (sem recriar Widget). */
export function syncVLibrasWithStore(enabled: boolean): void {
  if (enabled) {
    activateVLibras();
  } else {
    deactivateVLibras();
  }
}

/** Estado inicial do body (ex.: librasEnabled persistido no localStorage). */
export function syncVLibrasBodyClass(enabled: boolean): void {
  setBodyInactive(!enabled);
}
