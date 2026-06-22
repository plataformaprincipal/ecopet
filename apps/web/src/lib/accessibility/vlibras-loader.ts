import {
  VLIBRAS_AVATAR_POLL_MS,
  VLIBRAS_AVATAR_TIMEOUT_MS,
  VLIBRAS_SCRIPT_TIMEOUT_MS,
  VLIBRAS_SCRIPT_URLS,
  VLIBRAS_TOTAL_LOAD_TIMEOUT_MS,
  VLIBRAS_WIDGET_URL,
} from "./constants";
import {
  isVLibrasLoadReady,
  type VLibrasLoadOutcome,
  vlibrasFromScriptEvent,
  vlibrasReady,
  nextScriptUrl,
} from "./vlibras-load-outcome";

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

export type { VLibrasLoadOutcome, VLibrasLoadStatus } from "./vlibras-load-outcome";
export { handleScriptOnError, isVLibrasLoadReady } from "./vlibras-load-outcome";

let scriptPromise: Promise<boolean> | null = null;
let widgetInstance: VLibrasWidgetInstance | null = null;

const SCRIPT_ID = "ecopet-vlibras-plugin";

export const VW_ROOT_ID = "ecopet-vlibras-root";
export const VW_ACTIVE_CLASS = "ecopet-vlibras-active";
export const VW_HIDDEN_CLASS = "ecopet-vlibras-hidden";

function vlog(message: string, detail?: unknown): void {
  if (typeof console === "undefined") return;
  if (detail !== undefined) {
    console.log(`[VLIBRAS] ${message}`, detail);
  } else {
    console.log(`[VLIBRAS] ${message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      vlog("Timeout", `operação excedeu ${ms}ms`);
      resolve(onTimeout());
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getVLibrasRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.getElementById(VW_ROOT_ID) ??
    (document.querySelector("[vw]") as HTMLElement | null)
  );
}

async function waitForVLibrasRoot(timeoutMs = 3000): Promise<HTMLElement | null> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const root = getVLibrasRoot();
    if (root) return root;
    await sleep(50);
  }
  return getVLibrasRoot();
}

export function setVLibrasVisible(visible: boolean): void {
  const el = getVLibrasRoot();
  if (!el) return;
  el.classList.toggle(VW_ACTIVE_CLASS, visible);
  el.classList.toggle(VW_HIDDEN_CLASS, !visible);
  el.setAttribute("aria-hidden", visible ? "false" : "true");
}

/** Avatar oficial — única prova de que o VLibras está funcional. */
export function isVLibrasAvatarVisible(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector("[vw-access-button] .vp-access-button"));
}

function dispatchSpaLoadEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("load"));
  vlog("Evento load disparado");
  const handler = window.onload;
  if (typeof handler === "function") {
    handler.call(window, new Event("load"));
  }
}

/** Aguarda injeção do avatar (poll 500ms, timeout 10s). Sempre resolve true/false. */
export async function ensureAvatarInjected(
  timeoutMs = VLIBRAS_AVATAR_TIMEOUT_MS
): Promise<boolean> {
  vlog("ensureAvatarInjected iniciado", { timeoutMs, pollMs: VLIBRAS_AVATAR_POLL_MS });
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    dispatchSpaLoadEvent();
    if (isVLibrasAvatarVisible()) {
      vlog("Avatar encontrado");
      return true;
    }
    await sleep(VLIBRAS_AVATAR_POLL_MS);
  }

  vlog("Avatar não encontrado");
  vlog("Timeout");
  return false;
}

function removeInjectedScript(): void {
  document.getElementById(SCRIPT_ID)?.remove();
}

function waitForVLibrasGlobal(timeoutMs = VLIBRAS_SCRIPT_TIMEOUT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.VLibras) {
      resolve(true);
      return;
    }
    const started = performance.now();
    const tick = () => {
      if (window.VLibras) {
        resolve(true);
        return;
      }
      if (performance.now() - started >= timeoutMs) {
        vlog("Erro de carregamento", "window.VLibras indisponível");
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function createWidgetInstance(): boolean {
  try {
    if (!window.VLibras) {
      vlog("Erro de carregamento", "window.VLibras ausente");
      return false;
    }
    const root = getVLibrasRoot();
    if (!root) {
      vlog("Erro de carregamento", "container [vw] ausente");
      return false;
    }
    setVLibrasVisible(true);
    if (!widgetInstance) {
      widgetInstance = new window.VLibras.Widget(VLIBRAS_WIDGET_URL);
      vlog("Widget criado");
      dispatchSpaLoadEvent();
    }
    return true;
  } catch (err) {
    vlog("Erro de carregamento", err);
    return false;
  }
}

function injectScript(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    removeInjectedScript();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = url;
    script.async = true;

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(ok);
    };

    const timeoutId = setTimeout(() => {
      vlog("Timeout", `script ${url}`);
      removeInjectedScript();
      finish(false);
    }, VLIBRAS_SCRIPT_TIMEOUT_MS);

    script.onload = () => {
      vlog("Script carregado", url);
      finish(true);
    };

    script.onerror = () => {
      vlog("Erro de carregamento", `script.onerror ${url}`);
      removeInjectedScript();
      finish(false);
    };

    document.body.appendChild(script);
  });
}

async function loadScriptWithFallback(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (window.VLibras) {
    vlog("Script carregado", "window.VLibras já presente");
    return true;
  }

  const attempted: string[] = [];
  const maxRounds = VLIBRAS_SCRIPT_URLS.length;

  for (let round = 0; round < maxRounds; round++) {
    const url = nextScriptUrl(VLIBRAS_SCRIPT_URLS, attempted);
    if (!url) break;
    attempted.push(url);

    const loaded = await injectScript(url);
    if (!loaded) continue;

    const globalReady = await waitForVLibrasGlobal();
    if (globalReady) return true;
  }

  vlog("Erro de carregamento", "todas as URLs falharam");
  scriptPromise = null;
  return false;
}

async function ensureScriptLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.VLibras) return true;
  if (scriptPromise) return scriptPromise;

  scriptPromise = loadScriptWithFallback().then((ok) => {
    if (!ok) scriptPromise = null;
    return ok;
  });

  return scriptPromise;
}

async function loadVLibrasPipeline(): Promise<VLibrasLoadOutcome> {
  vlog("loadVLibras pipeline iniciado");

  const root = await waitForVLibrasRoot();
  if (!root) {
    vlog("Erro de carregamento", "container não montado");
    return vlibrasFromScriptEvent("init-failed");
  }

  setVLibrasVisible(true);

  if (isVLibrasAvatarVisible()) {
    vlog("Avatar encontrado");
    return vlibrasReady();
  }

  const scriptOk = await ensureScriptLoaded();
  if (!scriptOk) {
    return vlibrasFromScriptEvent("onerror");
  }

  const widgetOk = createWidgetInstance();
  if (!widgetOk) {
    return vlibrasFromScriptEvent("init-failed");
  }

  const avatarOk = await ensureAvatarInjected();
  if (!avatarOk) {
    return vlibrasFromScriptEvent("button-missing");
  }

  return vlibrasReady();
}

/**
 * Pipeline completo com teto global — nunca fica pendente além de VLIBRAS_TOTAL_LOAD_TIMEOUT_MS.
 * READY só quando [vw-access-button] .vp-access-button existe.
 */
export async function ensureVLibras(): Promise<VLibrasLoadOutcome> {
  if (typeof window === "undefined") {
    return vlibrasFromScriptEvent("init-failed");
  }

  return withTimeout(
    loadVLibrasPipeline(),
    VLIBRAS_TOTAL_LOAD_TIMEOUT_MS,
    () => vlibrasFromScriptEvent("button-missing")
  );
}

export function isVLibrasReady(): boolean {
  return isVLibrasAvatarVisible();
}

export function hideVLibras(): void {
  setVLibrasVisible(false);
}

export function resetVLibrasWidget(): void {
  widgetInstance?.destroy?.();
  widgetInstance = null;
  scriptPromise = null;
  removeInjectedScript();
}

export function retryVLibrasLoad(): void {
  resetVLibrasWidget();
}
