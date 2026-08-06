/**
 * Representação monetária segura em centavos (inteiro).
 * Conversão nas bordas Float/Decimal do schema legado.
 */

export type MoneyCents = number;

export function toCents(amount: number): MoneyCents {
  if (!Number.isFinite(amount)) throw new Error("INVALID_MONEY");
  return Math.round(amount * 100);
}

export function fromCents(cents: MoneyCents): number {
  if (!Number.isInteger(cents)) throw new Error("INVALID_CENTS");
  return cents / 100;
}

export function percentOfCents(baseCents: MoneyCents, percent: number): MoneyCents {
  if (!Number.isFinite(percent) || percent < 0) throw new Error("INVALID_PERCENT");
  return Math.round((baseCents * percent) / 100);
}

/** Distribui residual de centavos ao último item (determinístico). */
export function allocateCents(totalCents: MoneyCents, weights: number[]): MoneyCents[] {
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum <= 0) throw new Error("INVALID_WEIGHTS");
  const parts: MoneyCents[] = [];
  let allocated = 0;
  for (let i = 0; i < weights.length; i++) {
    if (i === weights.length - 1) {
      parts.push(totalCents - allocated);
    } else {
      const part = Math.floor((totalCents * weights[i]!) / weightSum);
      parts.push(part);
      allocated += part;
    }
  }
  return parts;
}

export function assertNonNegativeCents(cents: MoneyCents, label = "amount"): void {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
}
