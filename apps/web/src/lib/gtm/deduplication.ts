const recent = new Map<string, number>();
const DEFAULT_TTL_MS = 2_500;

/** Janela curta — bloqueia double-fire do mesmo clique/efeito, não ações reais distintas. */
export function shouldDedupeEvent(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS
): boolean {
  const now = Date.now();
  const prev = recent.get(key);
  if (prev && now - prev < ttlMs) return true;
  recent.set(key, now);
  // GC leve
  if (recent.size > 200) {
    for (const [k, ts] of recent) {
      if (now - ts > ttlMs * 4) recent.delete(k);
    }
  }
  return false;
}

/** Dedup transacional (purchase/refund) via sessionStorage — sobrevive reload. */
export function claimTransactionalOnce(kind: string, entityId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `ecopet.telemetry.${kind}.${entityId}`;
  try {
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return !shouldDedupeEvent(`${kind}:${entityId}`, 60_000);
  }
}

export function buildDedupeKey(
  event: string,
  parts: Array<string | number | undefined | null>
): string {
  return [event, ...parts.map((p) => String(p ?? ""))].join("|");
}
