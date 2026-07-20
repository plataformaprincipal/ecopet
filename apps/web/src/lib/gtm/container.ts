import { getGtmContainerId, shouldLoadGtm } from "./config";
import { ensureDataLayer } from "./datalayer";
import { gtmLog } from "./logger";

/** Snippet bootstrap oficial (antes do script externo). */
export function bootstrapGtmContainer(): boolean {
  if (typeof window === "undefined") return false;
  const id = getGtmContainerId();
  if (!id || !shouldLoadGtm()) return false;

  const layer = ensureDataLayer();
  // Fila GTM — equivalente ao snippet (function(w,d,s,l,i){... dataLayer.push({'gtm.start':...})
  layer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  gtmLog("info", "GTM container bootstrap", { masked: true });
  return true;
}

export function markGtmReady(ok: boolean) {
  if (typeof window === "undefined") return;
  window.__ecopetGtmReady = ok;
  if (!ok) window.__ecopetGtmLastError = "SCRIPT_LOAD_ERROR";
}

export function isGtmReady(): boolean {
  return typeof window !== "undefined" && Boolean(window.__ecopetGtmReady);
}

export function getGtmScriptSrc(containerId: string): string {
  return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
}

export function getGtmNoscriptSrc(containerId: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
}
