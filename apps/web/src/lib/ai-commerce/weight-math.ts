export type WeightPoint = { date: Date | string; kg: number };

export type WeightMath = {
  currentKg: number | null;
  previousKg: number | null;
  deltaKg: number | null;
  deltaPct: number | null;
  delta30dKg: number | null;
  delta30dPct: number | null;
  averageKg: number | null;
  trend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  source: "SYSTEM_CALCULATED";
};

function toDate(value: Date | string): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeWeightMath(points: WeightPoint[], currentOverride?: number | null): WeightMath {
  const series = [...points]
    .map((p) => ({ date: toDate(p.date), kg: Number(p.kg) }))
    .filter((p): p is { date: Date; kg: number } => Boolean(p.date) && Number.isFinite(p.kg) && p.kg > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const currentKg = currentOverride && Number.isFinite(currentOverride) && currentOverride > 0 ? currentOverride : series.at(-1)?.kg ?? null;
  const previousKg = series.length >= 2 ? series[series.length - 2]!.kg : null;
  const deltaKg = currentKg != null && previousKg != null ? Number((currentKg - previousKg).toFixed(3)) : null;
  const deltaPct = currentKg != null && previousKg != null && previousKg !== 0 ? Number((((currentKg - previousKg) / previousKg) * 100).toFixed(2)) : null;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const around30 = [...series].reverse().find((p) => p.date.getTime() <= cutoff) ?? (series.length >= 2 ? series[0] : null);
  const delta30dKg = currentKg != null && around30 ? Number((currentKg - around30.kg).toFixed(3)) : null;
  const delta30dPct = currentKg != null && around30 && around30.kg !== 0 ? Number((((currentKg - around30.kg) / around30.kg) * 100).toFixed(2)) : null;

  const averageKg = series.length ? Number((series.reduce((s, p) => s + p.kg, 0) / series.length).toFixed(3)) : currentKg;

  let trend: WeightMath["trend"] = "INSUFFICIENT_DATA";
  const basis = delta30dPct ?? deltaPct;
  if (basis == null) trend = "INSUFFICIENT_DATA";
  else if (Math.abs(basis) < 2) trend = "STABLE";
  else if (basis > 0) trend = "UP";
  else trend = "DOWN";

  return {
    currentKg,
    previousKg,
    deltaKg,
    deltaPct,
    delta30dKg,
    delta30dPct,
    averageKg,
    trend,
    source: "SYSTEM_CALCULATED",
  };
}
