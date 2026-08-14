export type VaccinationStatusCode = "EM_DIA" | "PROXIMA" | "ATRASADA" | "SEM_DATA";

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(next: Date | null): number | null {
  if (!next) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const n = new Date(next);
  n.setHours(0, 0, 0, 0);
  return Math.round((n.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function vaccinationStatus(nextDue?: string | Date | null): VaccinationStatusCode {
  const next = toDate(nextDue ?? null);
  if (!next) return "SEM_DATA";
  const days = daysUntil(next);
  if (days == null) return "SEM_DATA";
  if (days < 0) return "ATRASADA";
  if (days <= 30) return "PROXIMA";
  return "EM_DIA";
}

export function daysUntilNextDose(nextDue?: string | Date | null): number | null {
  return daysUntil(toDate(nextDue ?? null));
}
