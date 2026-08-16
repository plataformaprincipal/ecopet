/**
 * Chamadas same-origin para Route Handlers do Next.js (sem proxy /api/ecopet).
 * Use para /api/ai/*, /api/support/* e demais handlers locais do monorepo web.
 */
import { ApiRequestError, mapApiErrorMessage, parseApiFailureError } from "@/lib/api-errors";
import { USER_MESSAGES } from "@/schemas/validation/documents";

export async function localApi<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options ?? {};
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(USER_MESSAGES.CONNECTION, "CONNECTION");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const { code, message: rawMessage } = parseApiFailureError(
      typeof err === "object" && err !== null ? err : { error: res.statusText }
    );
    const message = mapApiErrorMessage(rawMessage || USER_MESSAGES.UNEXPECTED, code);
    throw new ApiRequestError(message, code, res.status);
  }

  return res.json() as Promise<T>;
}

export type LocalApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; code?: string; message?: string };

/** Variante que não lança — útil para preferências a11y (401 = visitante/token expirado). */
export async function localApiSafe<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<LocalApiResult<T>> {
  try {
    const data = await localApi<T>(path, options);
    return { ok: true, data, status: 200 };
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return {
        ok: false,
        status: err.status ?? 0,
        code: err.code,
        message: err.message,
      };
    }
    return { ok: false, status: 0 };
  }
}
