import { API_URL } from "./constants";
import { buildApiUrl } from "./api-url.client";
import { ApiRequestError, mapApiErrorMessage, parseApiFailureError } from "./api-errors";
import { USER_MESSAGES } from "@/schemas/validation/documents";

export async function api<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options || {};
  const url = buildApiUrl(API_URL, path);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "include",
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
    const { code, message: rawMessage } = parseApiFailureError(
      typeof err === "object" && err !== null ? err : { error: res.statusText }
    );
    const message = mapApiErrorMessage(rawMessage || USER_MESSAGES.UNEXPECTED, code);
    throw new ApiRequestError(message, code, res.status);
  }
  return res.json();
}
