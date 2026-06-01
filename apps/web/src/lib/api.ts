import { API_URL } from "./constants";
import { ApiRequestError, mapApiErrorMessage } from "./api-errors";
import { USER_MESSAGES } from "@/lib/validation/documents";

export async function api<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options || {};
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiRequestError(USER_MESSAGES.CONNECTION, "CONNECTION");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const rawMessage = typeof err.error === "string" ? err.error : USER_MESSAGES.UNEXPECTED;
    const code = typeof err.code === "string" ? err.code : undefined;
    const message = mapApiErrorMessage(rawMessage, code);
    throw new ApiRequestError(message, code, res.status);
  }
  return res.json();
}
