/** Períodos comparativos do Centro de Inteligência. */

export type BiPeriodPreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "year"
  | "custom";

export type BiDateRange = {
  preset: BiPeriodPreset;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  label: string;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Parse YYYY-MM-DD como data local (evita shift UTC). */
function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return startOfDay(new Date(isoDate));
  return new Date(y, m - 1, d);
}

export function resolveBiDateRange(input: {
  period?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  now?: Date;
}): BiDateRange {
  const now = input.now ?? new Date();
  const preset = (input.period as BiPeriodPreset) || "30d";

  if (preset === "custom" && input.dateFrom && input.dateTo) {
    const from = parseLocalDate(input.dateFrom);
    const to = endOfDay(parseLocalDate(input.dateTo));
    const ms = Math.max(1, to.getTime() - from.getTime());
    return {
      preset: "custom",
      from,
      to,
      previousFrom: new Date(from.getTime() - ms),
      previousTo: new Date(from.getTime() - 1),
      label: `${input.dateFrom} → ${input.dateTo}`,
    };
  }

  const today = startOfDay(now);
  const end = endOfDay(now);

  switch (preset) {
    case "today": {
      const prev = new Date(today);
      prev.setDate(prev.getDate() - 1);
      return {
        preset: "today",
        from: today,
        to: end,
        previousFrom: startOfDay(prev),
        previousTo: endOfDay(prev),
        label: "Hoje",
      };
    }
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const p = new Date(y);
      p.setDate(p.getDate() - 1);
      return {
        preset: "yesterday",
        from: startOfDay(y),
        to: endOfDay(y),
        previousFrom: startOfDay(p),
        previousTo: endOfDay(p),
        label: "Ontem",
      };
    }
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from);
      prevFrom.setDate(prevFrom.getDate() - 7);
      return {
        preset: "7d",
        from,
        to: end,
        previousFrom: prevFrom,
        previousTo: endOfDay(prevTo),
        label: "Últimos 7 dias",
      };
    }
    case "90d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 89);
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from);
      prevFrom.setDate(prevFrom.getDate() - 90);
      return {
        preset: "90d",
        from,
        to: end,
        previousFrom: prevFrom,
        previousTo: endOfDay(prevTo),
        label: "Últimos 90 dias",
      };
    }
    case "year": {
      const from = new Date(now.getFullYear(), 0, 1);
      return {
        preset: "year",
        from,
        to: end,
        previousFrom: new Date(now.getFullYear() - 1, 0, 1),
        previousTo: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
        label: `Ano ${now.getFullYear()}`,
      };
    }
    case "30d":
    default: {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from);
      prevFrom.setDate(prevFrom.getDate() - 30);
      return {
        preset: "30d",
        from,
        to: end,
        previousFrom: prevFrom,
        previousTo: endOfDay(prevTo),
        label: "Últimos 30 dias",
      };
    }
  }
}

export const BI_PERIOD_OPTIONS: { value: BiPeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Personalizado" },
];
