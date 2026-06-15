type ApiBody<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

export async function gestorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as ApiBody<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? `Erro ${res.status}`);
  }
  return body.data as T;
}

export type GestorMetric = { key: string; label: string; value: number; variant?: string };

export type GestorListResponse = {
  metrics?: GestorMetric[];
  items?: Record<string, unknown>[];
  pagination?: { page: number; limit: number; total: number; pages: number };
  disclaimer?: string;
  [key: string]: unknown;
};

export function buildGestorQuery(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (!params) return "";
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchGestorSection(endpoint: string, params?: Record<string, string | number | undefined>) {
  return gestorFetch<GestorListResponse>(`/api/admin/gestor/${endpoint}${buildGestorQuery(params)}`);
}

export async function exportGestorCsv(type: string, params?: Record<string, string | number | undefined>) {
  const res = await fetch(`/api/admin/gestor/reports/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...params }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiBody<unknown>;
    throw new Error(body.error?.message ?? `Erro ${res.status}`);
  }
  return res.text();
}
