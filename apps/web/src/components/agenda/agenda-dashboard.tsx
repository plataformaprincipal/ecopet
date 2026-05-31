"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, Repeat, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
import { AGENDA_EVENTS, AGENDA_WEEK } from "@/lib/agenda/mock-data";
import type { AgendaView } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  consultation: "border-l-ecopet-green",
  service: "border-l-ecopet-yellow",
  health: "border-l-blue-500",
  meeting: "border-l-purple-500",
  campaign: "border-l-pink-500",
  task: "border-l-ecopet-gray",
};

export function AgendaDashboard() {
  const [view, setView] = useState<AgendaView>("week");
  const todayEvents = AGENDA_EVENTS.filter((e) => e.date === "2026-05-28");

  return (
    <>
      <AppHeader title="Agenda" />
      <main className="relative mx-auto max-w-5xl flex-1 p-4 lg:p-6 space-y-6">
        <EcopetWatermark />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="heading-2">Agenda Profissional</h1>
            <p className="secondary-text">Consultas · Serviços · Eventos · Campanhas</p>
          </div>
          <div className="flex gap-2">
            {(["day", "week", "month"] as AgendaView[]).map((v) => (
              <Button key={v} variant={view === v ? "default" : "outline"} size="sm" onClick={() => setView(v)}>
                {v === "day" ? "Diário" : v === "week" ? "Semanal" : "Mensal"}
              </Button>
            ))}
            <Button size="sm"><Plus className="h-4 w-4" /> Novo</Button>
          </div>
        </div>

        {/* Navegação calendário */}
        <Card className="card-premium">
          <CardContent className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon"><ChevronLeft className="h-5 w-5" /></Button>
            <div className="text-center">
              <p className="font-display font-extrabold">Maio 2026</p>
              <p className="caption-text">Semana 21 — 26 a 01 Jun</p>
            </div>
            <Button variant="ghost" size="icon"><ChevronRight className="h-5 w-5" /></Button>
          </CardContent>
        </Card>

        {/* Visão semanal */}
        {view === "week" && (
          <div className="relative grid grid-cols-7 gap-2">
            {AGENDA_WEEK.map((d) => (
              <Card key={d.day} className={cn("card-premium text-center", d.day === "Qua" && "ring-2 ring-ecopet-green")}>
                <CardContent className="p-3">
                  <p className="caption-text">{d.day}</p>
                  <p className="font-display text-xl font-extrabold">{d.events}</p>
                  <p className="caption-text">eventos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Eventos do dia */}
        <div className="relative space-y-3">
          <h2 className="section-title flex items-center gap-2"><Calendar className="h-5 w-5 text-ecopet-green" /> Hoje — 28/05</h2>
          {todayEvents.map((event) => (
            <Card key={event.id} className={cn("card-premium border-l-4", typeColors[event.type])}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="secondary-text flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time} · {event.duration}</span>
                    <span>{event.partner}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.recurring && <Repeat className="h-4 w-4 text-ecopet-gray" />}
                  <Badge variant={event.status === "confirmed" ? "default" : "premium"}>
                    {event.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximos */}
        <div className="relative space-y-3">
          <h2 className="section-title">Próximos eventos</h2>
          {AGENDA_EVENTS.filter((e) => e.date !== "2026-05-28").map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-xl border border-ecopet-gray/10 px-4 py-3 dark:bg-ecopet-dark-card">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="caption-text">{event.date} · {event.time} — {event.partner}</p>
              </div>
              <Badge variant="default">{event.type}</Badge>
            </div>
          ))}
        </div>

        <AIInsightsPanel
          title="IA de Organização"
          insights={[
            { id: "a1", title: "Otimização de agenda", description: "Consolidar banho e consulta no mesmo dia economiza deslocamento.", tag: "Sugestão", priority: "medium" },
            { id: "a2", title: "Lembrete vacina", description: "Vacina V10 Thor em 8 dias — agendar com antecedência.", tag: "Saúde", priority: "high", action: "Agendar", href: "/agenda" },
          ]}
        />
      </main>
    </>
  );
}
