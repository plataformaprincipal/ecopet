export const BIRTH_DATE_FUTURE_MESSAGE = "A data de nascimento não pode ser futura.";
export const BIRTH_DATE_TOO_YOUNG_MESSAGE = "É necessário ter mais de 1 ano.";
export const BIRTH_DATE_TOO_OLD_MESSAGE = "A idade máxima permitida é de 130 anos.";

export const MIN_AGE_YEARS = 1;
export const MAX_AGE_YEARS = 130;

function parseBirthDate(value: string): Date | null {
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

/** Data máxima permitida: hoje menos 1 ano (mesmo dia/mês). */
export function getMaxBirthDateString(reference = new Date()): string {
  const d = new Date(reference);
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return toIsoDate(d);
}

/** Data mínima permitida: hoje menos 130 anos. */
export function getMinBirthDateString(reference = new Date()): string {
  const d = new Date(reference);
  d.setFullYear(d.getFullYear() - MAX_AGE_YEARS);
  return toIsoDate(d);
}

export function validateBirthDate(value: string, reference = new Date()): string | undefined {
  if (!value.trim()) return "Data de nascimento obrigatória.";

  const d = parseBirthDate(value);
  if (!d) return "Data de nascimento inválida.";

  const today = new Date(reference);
  today.setHours(23, 59, 59, 999);

  if (d > today) return BIRTH_DATE_FUTURE_MESSAGE;

  const maxAllowed = parseBirthDate(getMaxBirthDateString(reference));
  if (maxAllowed && d > maxAllowed) return BIRTH_DATE_TOO_YOUNG_MESSAGE;

  const minAllowed = parseBirthDate(getMinBirthDateString(reference));
  if (minAllowed && d < minAllowed) return BIRTH_DATE_TOO_OLD_MESSAGE;

  return undefined;
}

export function getBirthDateBounds(reference = new Date()) {
  return {
    min: getMinBirthDateString(reference),
    max: getMaxBirthDateString(reference),
  };
}
