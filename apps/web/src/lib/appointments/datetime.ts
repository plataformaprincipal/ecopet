/** Utilitários de data/hora locais (America/Sao_Paulo no runtime do servidor Node). */

export function parseDateIso(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfTomorrowLocal(): Date {
  const t = startOfLocalDay();
  t.setDate(t.getDate() + 1);
  return t;
}

export function localDateTime(year: number, month: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isSunday(weekday: number): boolean {
  return weekday === 0;
}
