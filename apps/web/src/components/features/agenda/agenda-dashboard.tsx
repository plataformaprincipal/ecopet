"use client";

import { useState } from "react";
import { CalendarPlus, ListChecks } from "lucide-react";
import { AppHeader } from "@/components/layouts/app-header";
import { EcopetWatermark } from "@/components/shared/brand/ecopet-symbol";
import { AppointmentBookingForm } from "./appointment-booking-form";
import { AppointmentsList } from "./appointments-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AgendaTab = "book" | "list";

export function AgendaDashboard() {
  const [tab, setTab] = useState<AgendaTab>("book");
  const [listKey, setListKey] = useState(0);

  return (
    <>
      <AppHeader title="Agendamento" />
      <main className="relative mx-auto max-w-3xl flex-1 space-y-6 p-4 animate-fade-in lg:p-6">
        <EcopetWatermark />

        <div className="rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-white/10 dark:bg-ecopet-dark-card sm:p-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ecopet-dark dark:text-white">
            Agendamento ECOPET
          </h1>
          <p className="mt-2 text-sm text-ecopet-gray dark:text-white/70">
            Banho, tosa, consultas, vacinas e mais — escolha pet, serviço, data e horário.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "book" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("book")}
            className={cn("rounded-[var(--radius-button)] gap-2", tab === "book" && "shadow-[var(--shadow-xs)]")}
          >
            <CalendarPlus className="h-4 w-4" strokeWidth={2} />
            Novo agendamento
          </Button>
          <Button
            type="button"
            variant={tab === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("list")}
            className={cn("rounded-[var(--radius-button)] gap-2", tab === "list" && "shadow-[var(--shadow-xs)]")}
          >
            <ListChecks className="h-4 w-4" strokeWidth={2} />
            Meus agendamentos
          </Button>
        </div>

        {tab === "book" ? (
          <AppointmentBookingForm
            onSuccess={() => {
              setListKey((k) => k + 1);
              setTab("list");
            }}
          />
        ) : (
          <AppointmentsList key={listKey} />
        )}
      </main>
    </>
  );
}
