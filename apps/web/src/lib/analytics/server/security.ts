import "server-only";

import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth/require-auth";
import type { ApiGuardResult } from "@/lib/auth/guards";

/** RBAC — somente ADMIN (Admin Interno). */
export async function requireAnalyticsAdmin(): Promise<ApiGuardResult> {
  return requireRole(UserRole.ADMIN);
}

/** Remove campos sensíveis de qualquer payload de resposta. */
export function sanitizeAnalyticsPayload<T extends Record<string, unknown>>(payload: T): T {
  const blocked =
    /measurementid$|service_account|private_key|secret|password|token|cookie|jwt|authorization|email|cpf/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (blocked.test(k)) continue;
    if (typeof v === "string" && v.includes("@") && v.includes(".")) continue;
    out[k] = v;
  }
  return out as T;
}

export function assertNoSecretsInJson(value: unknown): boolean {
  const dumped = JSON.stringify(value ?? {});
  if (/BEGIN PRIVATE KEY/i.test(dumped)) return false;
  if (/\"private_key\"/i.test(dumped)) return false;
  return true;
}
