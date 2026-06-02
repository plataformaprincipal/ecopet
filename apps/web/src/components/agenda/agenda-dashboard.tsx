"use client";

import { useState } from "react";
import { CalendarPlus, ListChecks } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
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
      <main className="relative mx-auto max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
        <EcopetWatermark />

        <div>
          <h1 className="heading-2">Agendamento ECOPET</h1>
          <p className="secondary-text">
            Banho, tosa, consultas, vacinas e mais — escolha pet, serviço, data e horário.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "book" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("book")}
            className={cn(tab === "book" && "gap-2")}
          >
            <CalendarPlus className="h-4 w-4" />
            Novo agendamento
          </Button>
          <Button
            type="button"
            variant={tab === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("list")}
          >
            <ListChecks className="h-4 w-4" />
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
