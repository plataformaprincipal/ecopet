import "server-only";

import type { AnalyticsConfigFlags } from "./types";

export function validateConfigFlags(input: unknown): {
  ok: boolean;
  flags?: AnalyticsConfigFlags;
  error?: string;
} {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Payload inválido." };
  }
  const raw = input as Record<string, unknown>;
  const flags: AnalyticsConfigFlags = {};

  if ("debugLogging" in raw) {
    if (typeof raw.debugLogging !== "boolean") {
      return { ok: false, error: "debugLogging deve ser boolean." };
    }
    flags.debugLogging = raw.debugLogging;
  }
  if ("cacheTtlSec" in raw) {
    const n = Number(raw.cacheTtlSec);
    if (!Number.isFinite(n) || n < 5 || n > 300) {
      return { ok: false, error: "cacheTtlSec deve estar entre 5 e 300." };
    }
    flags.cacheTtlSec = Math.round(n);
  }
  if ("healthJobsEnabled" in raw) {
    if (typeof raw.healthJobsEnabled !== "boolean") {
      return { ok: false, error: "healthJobsEnabled deve ser boolean." };
    }
    flags.healthJobsEnabled = raw.healthJobsEnabled;
  }

  if (Object.keys(flags).length === 0) {
    return { ok: false, error: "Nenhuma flag válida informada." };
  }
  return { ok: true, flags };
}

export function validateDebugEventName(name: unknown): name is string {
  return typeof name === "string" && /^[a-z][a-z0-9_]{1,39}$/i.test(name);
}
