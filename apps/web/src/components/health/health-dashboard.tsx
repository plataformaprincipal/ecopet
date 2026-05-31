"use client";

import Link from "next/link";
import {
  Syringe, Stethoscope, FileText, Video, Heart, Activity, Pill, Calendar,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { EcopetWatermark } from "@/components/brand/ecopet-symbol";
import { MOCK_MY_PET } from "@/lib/my-pet/mock-data";

const HEALTH_MODULES = [
  { href: "/meu-pet", label: "Carteira Vacinal", icon: Syringe, desc: "Vacinas e reforços" },
  { href: "/meu-pet", label: "Prontuário", icon: FileText, desc: "Histórico clínico completo" },
  { href: "/veterinarios", label: "Telemedicina", icon: Video, desc: "Consultas online 24h" },
  { href: "/agenda", label: "Consultas", icon: Stethoscope, desc: "Agendamentos e retornos" },
  { href: "/iot", label: "Monitoramento", icon: Activity, desc: "Wearables e IoT" },
  { href: "/ia", label: "IA Saúde", icon: Heart, desc: "Triagem e recomendações" },
];

export function HealthDashboard() {
  const pet = MOCK_MY_PET;

  return (
    <>
      <AppHeader title="ECOPET Health" />
      <main className="relative mx-auto max-w-5xl flex-1 p-4 lg:p-6 space-y-6">
        <EcopetWatermark />

        <div className="relative">
          <h1 className="heading-2">Saúde Preventiva</h1>
          <p className="secondary-text">Carteira vacinal · Monitoramento · Telemedicina veterinária</p>
        </div>

        <Card className="card-premium border-ecopet-green/20 gradient-ecopet-accent text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-white/20 text-white mb-2">ECOPET Health</Badge>
                <h2 className="font-display text-2xl font-extrabold">{pet.name}</h2>
                <p className="text-white/80 text-sm">{pet.breed} · Saúde {pet.healthStatus === "good" ? "Boa" : "Atenção"}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold">92%</p>
                <p className="text-xs text-white/70">Score bem-estar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEALTH_MODULES.map((mod) => (
            <Link key={mod.label} href={mod.href}>
              <Card className="card-premium h-full">
                <CardContent className="p-4">
                  <mod.icon className="h-8 w-8 text-ecopet-green mb-3" />
                  <h3 className="font-semibold">{mod.label}</h3>
                  <p className="caption-text mt-1">{mod.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="card-premium">
          <CardContent className="p-4">
            <h2 className="section-title mb-3">Próximos cuidados — {pet.name}</h2>
            <div className="space-y-2">
              {pet.vaccines.map((v) => (
                <div key={v.name} className="flex items-center justify-between rounded-xl bg-ecopet-green/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><Syringe className="h-4 w-4 text-ecopet-green" /> {v.name}</span>
                  <span className="caption-text">Próximo: {v.next}</span>
                </div>
              ))}
              {pet.medications.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-xl bg-ecopet-gray/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><Pill className="h-4 w-4" /> {m.name}</span>
                  <span className="caption-text">{m.dose}</span>
                </div>
              ))}
            </div>
            <Link href="/agenda"><Button variant="outline" className="mt-4 w-full sm:w-auto"><Calendar className="h-4 w-4" /> Agendar consulta</Button></Link>
          </CardContent>
        </Card>

        <AIInsightsPanel
          title="IA ECOPET Health"
          insights={pet.aiAlerts.map((a, i) => ({
            id: `h${i}`,
            title: a.text.split("—")[0] || a.text,
            description: a.text,
            tag: a.type === "health" ? "Saúde" : a.type === "warning" ? "Alerta" : "Info",
            priority: a.type === "warning" ? "high" as const : "low" as const,
          }))}
        />
      </main>
    </>
  );
}
