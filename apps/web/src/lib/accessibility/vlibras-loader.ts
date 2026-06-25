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

let scriptInjected = false;

let widgetInstance: VLibrasWidgetInstance | null = null;



const SCRIPT_ID = "ecopet-vlibras-plugin";

const IS_DEV = process.env.NODE_ENV === "development";



export const VW_ROOT_ID = "ecopet-vlibras-root";

export const VW_ACTIVE_CLASS = "ecopet-vlibras-active";

export const VW_HIDDEN_CLASS = "ecopet-vlibras-hidden";



function vlogInfo(message: string, detail?: unknown): void {

  if (!IS_DEV || typeof console === "undefined") return;

  if (detail !== undefined) console.info(`[VLIBRAS] ${message}`, detail);

  else console.info(`[VLIBRAS] ${message}`);

}



/** Falha esperada (rede externa, bloqueio, gov.br fora) — nunca console.error. */

function vlogUnavailable(message: string, detail?: unknown): void {

  if (!IS_DEV || typeof console === "undefined") return;

  if (detail !== undefined) console.warn(`[VLIBRAS] ${message}`, detail);

  else console.warn(`[VLIBRAS] ${message}`);

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

      vlogUnavailable("Timeout", `operação excedeu ${ms}ms`);

      resolve(onTimeout());

    }, ms);

  });



  try {

    return await Promise.race([promise, timeoutPromise]);

  } finally {

    if (timeoutId) clearTimeout(timeoutId);

  }

}



/** Diagnóstico opcional (dev): fetch HEAD distingue rede vs bloqueio na tag script. */

async function probeScriptUrl(url: string): Promise<void> {

  if (!IS_DEV) return;

  try {

    const res = await fetch(url, { method: "HEAD", cache: "no-store" });

    vlogUnavailable("Diagnóstico rede (fetch HEAD)", {

      url,

      status: res.status,

      ok: res.ok,

      hint: res.ok

        ? "Rede OK — script.onerror pode ser bloqueador (ERR_BLOCKED_BY_CLIENT) ou CSP na tag"

        : "HTTP não-OK",

    });

  } catch (err) {

    vlogUnavailable("Diagnóstico rede — fetch falhou (DNS/timeout/firewall)", { url, err });

  }

}



export function getVLibrasRoot(): HTMLElement | null {

  if (typeof document === "undefined") return null;

  return (

    document.getElementById(VW_ROOT_ID) ??

    (document.querySelector("[vw].enabled") as HTMLElement | null)

  );

}



async function waitForVLibrasRoot(timeoutMs = 3000): Promise<HTMLElement | null> {

  const start = performance.now();

  while (performance.now() - start < timeoutMs) {

    const root = getVLibrasRoot();

    if (root?.querySelector("[vw-access-button]")) return root;

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



export function isVLibrasAvatarVisible(): boolean {

  if (typeof document === "undefined") return false;

  const accessButton = document.querySelector("[vw-access-button]");

  if (!accessButton) return false;

  // 1) Marcações conhecidas do botão de acesso (variam entre versões do plugin gov.br)

  if (
    accessButton.querySelector(
      ".vp-access-button, .vpw-access-button, .access-button, img, button, svg, [class*='access']"
    )
  ) {
    return true;
  }

  // 2) Plugin injetou qualquer conteúdo dentro do botão de acesso

  if (accessButton.childElementCount > 0) return true;

  if (typeof window !== "undefined") {
    // 3) Ícone azul renderizado via background-image (CSS oficial gov.br), sem filhos

    const bg = window.getComputedStyle(accessButton).backgroundImage;

    if (bg && bg !== "none") return true;

    // 4) Plugin global carregado e instanciado — o ícone é pintado pelo gov.br

    if (window.VLibras) return true;
  }

  return false;

}



export function notifyVLibrasRouteChange(): void {

  if (typeof window === "undefined" || !window.VLibras) return;

  window.dispatchEvent(new Event("load"));

  vlogInfo("Navegação SPA — evento load disparado");

}



function dispatchSpaLoadEvent(): void {

  if (!window.VLibras) return;

  notifyVLibrasRouteChange();

  const handler = window.onload;

  if (typeof handler === "function") {

    try {

      handler.call(window, new Event("load"));

    } catch {

      /* noop — handler legado não deve derrubar o app */

    }

  }

}



export async function ensureAvatarInjected(

  timeoutMs = VLIBRAS_AVATAR_TIMEOUT_MS

): Promise<boolean> {

  if (!window.VLibras) return false;



  vlogInfo("ensureAvatarInjected iniciado", { timeoutMs, pollMs: VLIBRAS_AVATAR_POLL_MS });

  const start = performance.now();



  while (performance.now() - start < timeoutMs) {

    dispatchSpaLoadEvent();

    if (isVLibrasAvatarVisible()) {

      vlogInfo("Avatar encontrado");

      return true;

    }

    await sleep(VLIBRAS_AVATAR_POLL_MS);

  }



  vlogUnavailable("Avatar não encontrado após timeout");

  return false;

}



function removeFailedScriptOnly(): void {

  const node = document.getElementById(SCRIPT_ID);

  if (node && !window.VLibras) {

    node.remove();

    scriptInjected = false;

  }

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

        vlogUnavailable("window.VLibras indisponível após onload do script");

        resolve(false);

        return;

      }

      requestAnimationFrame(tick);

    };

    tick();

  });

}



function createWidgetInstance(): boolean {

  if (!window.VLibras) {

    vlogUnavailable("Inicialização ignorada — window.VLibras ausente");

    return false;

  }



  try {

    const root = getVLibrasRoot();

    if (!root?.querySelector("[vw-access-button]")) {

      vlogUnavailable("DOM oficial incompleto — inicialização ignorada");

      return false;

    }



    setVLibrasVisible(true);



    if (widgetInstance) {

      vlogInfo("Widget já existente — reutilizando instância");

      dispatchSpaLoadEvent();

      return true;

    }



    widgetInstance = new window.VLibras.Widget(VLIBRAS_WIDGET_URL);

    vlogInfo("Widget criado", VLIBRAS_WIDGET_URL);

    dispatchSpaLoadEvent();

    return true;

  } catch (err) {

    vlogUnavailable("Falha ao criar widget (serviço externo)", err);

    widgetInstance = null;

    return false;

  }

}



function injectScript(url: string): Promise<boolean> {

  return new Promise((resolve) => {

    if (scriptInjected && window.VLibras) {

      vlogInfo("Script carregado", "já presente — sem reinjeção");

      resolve(true);

      return;

    }



    const existing = document.getElementById(SCRIPT_ID);

    if (existing && window.VLibras) {

      scriptInjected = true;

      vlogInfo("Script carregado", "tag existente + window.VLibras");

      resolve(true);

      return;

    }



    removeFailedScriptOnly();

    void probeScriptUrl(url);

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = url;
    script.async = true;

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (ok) scriptInjected = true;
      resolve(ok);
    };

    const timeoutId = setTimeout(() => {
      vlogUnavailable("Timeout ao carregar script", url);
      removeFailedScriptOnly();
      finish(false);
    }, VLIBRAS_SCRIPT_TIMEOUT_MS);

    script.onload = () => {
      vlogInfo("Script carregado", url);
      finish(true);
    };

    script.onerror = () => {
      vlogUnavailable("script.onerror — tag bloqueada ou rede indisponível", url);
      removeFailedScriptOnly();
      finish(false);
    };

    document.body.appendChild(script);
  });
}



async function loadScriptWithFallback(): Promise<boolean> {

  if (typeof window === "undefined") return false;



  if (window.VLibras) {

    vlogInfo("Script carregado", "window.VLibras já presente");

    return true;

  }



  const attempted: string[] = [];



  for (let round = 0; round < VLIBRAS_SCRIPT_URLS.length; round++) {

    const url = nextScriptUrl(VLIBRAS_SCRIPT_URLS, attempted);

    if (!url) break;

    attempted.push(url);



    const loaded = await injectScript(url);

    if (!loaded) continue;



    const globalReady = await waitForVLibrasGlobal();

    if (globalReady) return true;

  }



  vlogUnavailable("Todas as URLs de script falharam — VLibras indisponível");

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

  vlogInfo("Pipeline iniciado");



  const root = await waitForVLibrasRoot();

  if (!root) {

    vlogUnavailable("DOM [vw] não montado");

    return vlibrasFromScriptEvent("init-failed");

  }



  if (isVLibrasAvatarVisible()) {

    vlogInfo("Avatar já visível — pipeline curto");

    setVLibrasVisible(true);

    return vlibrasReady();

  }



  const scriptOk = await ensureScriptLoaded();

  if (!scriptOk) {

    setVLibrasVisible(false);

    return vlibrasFromScriptEvent("onerror");

  }



  if (!window.VLibras) {

    setVLibrasVisible(false);

    return vlibrasFromScriptEvent("global-missing");

  }



  const widgetOk = createWidgetInstance();

  if (!widgetOk) {

    setVLibrasVisible(false);

    return vlibrasFromScriptEvent("init-failed");

  }



  // Widget instanciado com sucesso: o ícone azul é renderizado pelo próprio plugin gov.br.

  // Disparamos o "nudge" do avatar em segundo plano e NÃO escondemos o botão caso a

  // marcação interna do gov.br mude entre versões (evita falso "indisponível").

  void ensureAvatarInjected().then((ok) => {

    if (ok) vlogInfo("Avatar confirmado após init");

    else vlogUnavailable("Avatar não confirmado por seletor — ícone segue visível (render gov.br)");

  });



  setVLibrasVisible(true);

  return vlibrasReady();

}



export async function ensureVLibras(): Promise<VLibrasLoadOutcome> {

  if (typeof window === "undefined") {

    return vlibrasFromScriptEvent("init-failed");

  }



  try {

    return await withTimeout(

      loadVLibrasPipeline(),

      VLIBRAS_TOTAL_LOAD_TIMEOUT_MS,

      () => {

        setVLibrasVisible(false);

        return vlibrasFromScriptEvent("button-missing");

      }

    );

  } catch {

    setVLibrasVisible(false);

    return vlibrasFromScriptEvent("onerror");

  }

}



export function isVLibrasReady(): boolean {

  return isVLibrasAvatarVisible();

}



export function hideVLibras(): void {

  setVLibrasVisible(false);

}



export function resetVLibrasWidget(): void {

  if (widgetInstance) {

    try {

      widgetInstance.destroy?.();

    } catch (err) {

      vlogUnavailable("destroy() falhou", err);

    }

  }

  widgetInstance = null;



  if (!window.VLibras) {

    scriptPromise = null;

    scriptInjected = false;

    removeFailedScriptOnly();

  }



  vlogInfo("Instância resetada — pronto para nova tentativa");

}



export function retryVLibrasLoad(): void {

  resetVLibrasWidget();

}


