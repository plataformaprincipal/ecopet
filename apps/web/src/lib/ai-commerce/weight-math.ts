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

export type MerGoal = "maintenance" | "weight_loss" | "weight_gain" | "growth";
export type MerActivity = "low" | "moderate" | "high";

/** Fatores MER configurados. O LLM não inventa fator. */
export const MER_FACTORS = {
  intactAdult: 1.8,
  neuteredAdult: 1.6,
  lowActivity: 1.2,
  highActivity: 2.0,
  weightLoss: 1.0,
  weightGain: 1.4,
  growth: 2.5,
} as const;

export function computeRerKcal(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  return Math.round(70 * Math.pow(weightKg, 0.75));
}

export function merFactorFor(params: {
  goal?: string | null;
  neutered?: boolean | null;
  activity?: string | null;
}): number {
  const goal = String(params.goal ?? "").toLowerCase();
  const activity = String(params.activity ?? "").toLowerCase();
  if (goal.includes("perder") || goal.includes("loss") || goal.includes("reduz")) return MER_FACTORS.weightLoss;
  if (goal.includes("ganhar") || goal.includes("gain") || goal.includes("aument")) return MER_FACTORS.weightGain;
  if (goal.includes("filhote") || goal.includes("puppy") || goal.includes("kitten") || goal.includes("growth")) {
    return MER_FACTORS.growth;
  }
  if (activity.includes("alta") || activity.includes("high")) return MER_FACTORS.highActivity;
  if (activity.includes("baixa") || activity.includes("low")) return MER_FACTORS.lowActivity;
  if (params.neutered === true) return MER_FACTORS.neuteredAdult;
  if (params.neutered === false) return MER_FACTORS.intactAdult;
  return MER_FACTORS.neuteredAdult;
}

export function computeMerKcal(weightKg: number, factor: number): number {
  return Math.round(computeRerKcal(weightKg) * factor);
}

export function gramsPerDayFromKcal(merKcal: number, kcalPer100g: number): number | null {
  if (!Number.isFinite(merKcal) || merKcal <= 0) return null;
  if (!Number.isFinite(kcalPer100g) || kcalPer100g <= 0) return null;
  return Math.round((merKcal / kcalPer100g) * 100);
}

export type EnergyMath = {
  weightKg: number;
  rerKcal: number;
  merFactor: number;
  merKcal: number;
  kcalPer100g: number | null;
  gramsPerDay: number | null;
  source: "SYSTEM_CALCULATED";
};

export function computeEnergyMath(params: {
  weightKg: number;
  goal?: string | null;
  neutered?: boolean | null;
  activity?: string | null;
  kcalPer100g?: number | null;
}): EnergyMath {
  const factor = merFactorFor(params);
  const rerKcal = computeRerKcal(params.weightKg);
  const merKcal = computeMerKcal(params.weightKg, factor);
  const kcalPer100g = params.kcalPer100g && params.kcalPer100g > 0 ? params.kcalPer100g : null;
  return {
    weightKg: params.weightKg,
    rerKcal,
    merFactor: factor,
    merKcal,
    kcalPer100g,
    gramsPerDay: kcalPer100g ? gramsPerDayFromKcal(merKcal, kcalPer100g) : null,
    source: "SYSTEM_CALCULATED",
  };
}
