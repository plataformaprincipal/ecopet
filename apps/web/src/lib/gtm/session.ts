const KEY = "ecopet.gtm.anon_session.v1";

/** Session id anônimo (não PII) — reutiliza storage se existir. */
export function getGtmAnonymousSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 16)
        : `s_${Date.now().toString(36)}`;
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
