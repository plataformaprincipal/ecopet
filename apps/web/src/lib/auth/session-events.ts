export const SESSION_CHANGED_EVENT = "ecopet:session-changed";

export function notifySessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  }
}
