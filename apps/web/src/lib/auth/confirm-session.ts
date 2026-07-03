async function parseJsonBody(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Confirma que o cookie ecopet-session foi gravado e é legível pelo servidor. */
export async function confirmSessionCookie(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 80 * attempt));
    }

    const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    if (meRes.ok) {
      const meData = (await parseJsonBody(meRes)) as {
        success?: boolean;
        data?: { user?: unknown };
      } | null;
      if (meData?.success !== false && !!meData?.data?.user) return true;
    }

    const sessionRes = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });
    if (sessionRes.ok) {
      const sessionData = (await parseJsonBody(sessionRes)) as {
        authenticated?: boolean;
        user?: unknown;
      } | null;
      if (sessionData?.authenticated && sessionData.user) return true;
    }
  }
  return false;
}
