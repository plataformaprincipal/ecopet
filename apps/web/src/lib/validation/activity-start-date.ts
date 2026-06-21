export const ACTIVITY_START_FUTURE_MESSAGE = "A data de início das atividades não pode ser futura.";
export const ACTIVITY_START_INVALID_MESSAGE = "Informe uma data de início válida.";
export const ACTIVITY_START_TOO_OLD_MESSAGE = "Informe uma data de início válida.";

const MAX_YEARS_AGO = 100;

function parseDate(value: string): Date | null {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getMaxActivityStartDateString(reference = new Date()): string {
  return toIsoDate(reference);
}

export function getMinActivityStartDateString(reference = new Date()): string {
  const d = new Date(reference);
  d.setFullYear(d.getFullYear() - MAX_YEARS_AGO);
  return toIsoDate(d);
}

export function validateActivityStartDate(value: string, reference = new Date()): string | undefined {
  if (!value.trim()) return "Data de início das atividades obrigatória.";

  const d = parseDate(value);
  if (!d) return ACTIVITY_START_INVALID_MESSAGE;

  const today = new Date(reference);
  today.setHours(23, 59, 59, 999);
  if (d > today) return ACTIVITY_START_FUTURE_MESSAGE;

  const minAllowed = parseDate(getMinActivityStartDateString(reference));
  if (minAllowed && d < minAllowed) return ACTIVITY_START_TOO_OLD_MESSAGE;

  return undefined;
}

export function getActivityStartDateBounds(reference = new Date()) {
  return {
    min: getMinActivityStartDateString(reference),
    max: getMaxActivityStartDateString(reference),
  };
}
