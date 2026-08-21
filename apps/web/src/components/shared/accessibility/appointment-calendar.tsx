"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type AppointmentCalendarProps = {
  value: string;
  onChange: (isoDate: string) => void;
  /** 0=Dom … 6=Sáb. Padrão: bloqueia domingo (0). */
  disabledWeekdays?: number[];
  id?: string;
  label?: string;
  /** browse = meus agendamentos (permite passado; marca dias com eventos). */
  mode?: "booking" | "browse";
  markedDates?: string[];
  hint?: string;
};

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function startOfTomorrow() {
  const t = startOfToday();
  t.setDate(t.getDate() + 1);
  return t;
}

export function AppointmentCalendar({
  value,
  onChange,
  disabledWeekdays = [0],
  id = "appointment-date",
  label = "Selecione a data",
  mode = "booking",
  markedDates = [],
  hint,
}: AppointmentCalendarProps) {
  const [tomorrow] = useState(() => startOfTomorrow());
  const [today] = useState(() => startOfToday());
  const initial = value ? new Date(value + "T12:00:00") : mode === "browse" ? today : tomorrow;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const marked = new Set(markedDates);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows: { day: number | null; iso: string | null; disabled: boolean }[] = [];

    for (let i = 0; i < startPad; i++) {
      rows.push({ day: null, iso: null, disabled: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const iso = toIso(viewYear, viewMonth, d);
      const isBeforeTomorrow = mode === "booking" && date.getTime() < tomorrow.getTime();
      const isBlockedWeekday = mode === "booking" && disabledWeekdays.includes(date.getDay());
      rows.push({ day: d, iso, disabled: isBeforeTomorrow || isBlockedWeekday });
    }
    return rows;
  }, [viewYear, viewMonth, disabledWeekdays, tomorrow, mode]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const hintId = `${id}-hint`;

  return (
    <div role="group" aria-labelledby={`${id}-legend`}>
      <span id={`${id}-legend`} className="mb-2 block text-sm font-medium">
        {label}
      </span>
      <p id={hintId} className="mb-2 text-xs text-muted-foreground">
        {hint ??
          (mode === "browse"
            ? "Toque em um dia para ver os agendamentos."
            : "Segunda a sábado, das 08:00 às 18:00. Agendamentos a partir de amanhã. Domingos bloqueados.")}
      </p>
      <div className="rounded-lg border p-3" aria-describedby={hintId}>
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <Button type="button" variant="ghost" size="icon" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label="Calendário de agendamento">
          {cells.map((cell, i) =>
            cell.day == null ? (
              <div key={`empty-${i}`} role="gridcell" aria-hidden />
            ) : (
              <button
                key={cell.iso!}
                type="button"
                role="gridcell"
                disabled={cell.disabled}
                aria-label={`${cell.day} de ${MONTHS[viewMonth]} de ${viewYear}`}
                aria-selected={value === cell.iso}
                onClick={() => onChange(cell.iso!)}
                className={cn(
                  "relative aspect-square rounded-md text-sm transition",
                  cell.disabled && "cursor-not-allowed text-muted-foreground/40",
                  !cell.disabled && "hover:bg-primary/10",
                  value === cell.iso && "bg-primary text-primary-foreground hover:bg-primary",
                  cell.iso && today.getTime() === new Date(cell.iso + "T12:00:00").setHours(0, 0, 0, 0) && value !== cell.iso && "ring-1 ring-ecopet-green"
                )}
              >
                {cell.day}
                {cell.iso && marked.has(cell.iso) ? (
                  <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-ecopet-green" aria-hidden />
                ) : null}
              </button>
            )
          )}
        </div>
        {value && (
          <p className="mt-2 text-xs text-muted-foreground">
            Data selecionada:{" "}
            {new Date(value + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      <input type="hidden" id={id} name={id} value={value} required readOnly />
    </div>
  );
}
