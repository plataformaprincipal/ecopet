/** Validação compartilhada de datas de nascimento — ECOPET */

export const BIRTH_DATE_FUTURE_MESSAGE =
  "A data de nascimento não pode ser futura. Informe uma data igual ou anterior à data de hoje.";

/** Data máxima para inputs type="date" (YYYY-MM-DD, fuso local). */
export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isFutureDate(value: string): boolean {
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

export function validateBirthDate(value: string, required = true): string | undefined {
  if (!value?.trim()) return required ? "Data de nascimento é obrigatória" : undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Data de nascimento inválida";
  if (isFutureDate(value)) return BIRTH_DATE_FUTURE_MESSAGE;
  return undefined;
}

export function validateOptionalBirthDate(value: string): string | undefined {
  if (!value?.trim()) return undefined;
  return validateBirthDate(value, false);
}
