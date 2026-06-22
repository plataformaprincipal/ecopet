/**
 * Chamadas same-origin para rotas API locais do Next.js (sem proxy /api/ecopet).
 */
export async function localApi<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options ?? {};
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`localApi ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type LocalApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number };

/** Variante que não lança exceção — útil para preferências a11y (401 = visitante/token expirado). */
export async function localApiSafe<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<LocalApiResult<T>> {
  const { token, ...init } = options ?? {};
  try {
    const res = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
