type ApiBody<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

export type AdminModuleResponse = {
  metrics?: { key: string; label: string; value: number | string; variant?: string }[];
  items?: Record<string, unknown>[];
  tables?: { id: string; label: string; rows: Record<string, unknown>[] }[];
  tabs?: { id: string; label: string }[];
  quickActions?: { label: string; href: string }[];
  alerts?: { label: string; count: number; severity: string }[];
  integrations?: { name: string; status: string; message?: string }[];
  disclaimer?: string;
  pagination?: { page: number; limit: number; total: number; pages: number };
  [key: string]: unknown;
};

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export function buildAdminQuery(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (!params) return "";
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAdminModule(endpoint: string, params?: Record<string, string | number | undefined>) {
  return adminFetch<AdminModuleResponse>(`/api/admin/${endpoint}${buildAdminQuery(params)}`);
}
