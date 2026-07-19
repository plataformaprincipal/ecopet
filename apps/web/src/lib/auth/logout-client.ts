/** Encerra a sessão no servidor (cookie ecopet-session). */
export async function performLogout(): Promise<boolean> {
  let deviceId: string | undefined;
  try {
    deviceId = localStorage.getItem("ecopet.fcm.deviceId") || undefined;
  } catch {
    deviceId = undefined;
  }

  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: deviceId ? { "Content-Type": "application/json" } : undefined,
      body: deviceId ? JSON.stringify({ deviceId }) : undefined,
    });

    try {
      localStorage.removeItem("ecopet.fcm.tokenRegistered");
    } catch {
      /* ignore */
    }

    return res.ok;
  } catch {
    return false;
  }
}
