/** Cliente: leitura da sessão EcoPet via /api/auth/session (sempre JSON). */

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  accountStatus?: string;
  username?: string | null;
  avatarUrl?: string | null;
};

export type AuthSessionData = {
  user: AuthSessionUser;
};

type SessionApiBody =
  | { authenticated: true; user: AuthSessionUser }
  | { authenticated: false }
  | { error: string };

async function parseJsonBody(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Busca sessão no servidor. Retorna null se visitante ou erro. */
export async function fetchAuthSession(): Promise<AuthSessionData | null> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });
    const body = (await parseJsonBody(res)) as SessionApiBody | null;
    if (!body || !("authenticated" in body) || !body.authenticated || !body.user) {
      return null;
    }
    return { user: body.user };
  } catch {
    return null;
  }
}
