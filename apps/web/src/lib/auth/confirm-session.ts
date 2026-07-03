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
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  if (!res.ok) return false;
  const data = (await parseJsonBody(res)) as {
    success?: boolean;
    data?: { user?: unknown };
  } | null;
  return data?.success !== false && !!data?.data?.user;
}
