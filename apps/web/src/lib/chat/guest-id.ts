const GUEST_KEY = "ecopet-guest-id";
const SESSION_KEY = "ecopet-guest-session";

export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function getGuestSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearGuestSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
