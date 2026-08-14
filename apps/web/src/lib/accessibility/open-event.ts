/** Evento usado para abrir a barra de acessibilidade de fora do componente. */
export const ACCESSIBILITY_OPEN_EVENT = "ecopet:accessibility:open";

export function requestAccessibilityPanel(): boolean {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(new Event(ACCESSIBILITY_OPEN_EVENT));
  return true;
}
