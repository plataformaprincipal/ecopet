"use client";

import { ExternalMetricsCard } from "./external-metrics-card";
import { ProfileSection } from "@/components/features/profile/shared/smart-widgets";

const EXTERNAL_SOURCES = [
  {
    source: "instagram" as const, name: "Instagram", connected: true, lastSync: "Há 15 min",
    metrics: [{ label: "Seguidores", value: "12.4k" }, { label: "Alcance", value: "45.2k" }, { label: "Engajamento", value: "8.4%" }, { label: "Reels", value: "24" }],
  },
  {
    source: "whatsapp" as const, name: "WhatsApp Business", connected: true, lastSync: "Há 5 min",
    metrics: [{ label: "Conversas", value: "890" }, { label: "Resposta", value: "4 min" }, { label: "Mensagens", value: "12.4k" }, { label: "Conversões", value: "156" }],
  },
  {
    source: "google" as const, name: "Google Analytics", connected: true, lastSync: "Há 1h",
    metrics: [{ label: "Visitas", value: "28.5k" }, { label: "Origem orgânica", value: "62%" }, { label: "Páginas/top", value: "/marketplace" }, { label: "Taxa rejeição", value: "32%" }],
  },
  {
    source: "marketplace" as const, name: "Marketplace Externo", connected: false,
    metrics: [],
  },
];

export function IntegrationMetricsPanel() {
  return (
    <ProfileSection title="Sistemas externos conectados" description="Métricas sincronizadas de plataformas vinculadas">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXTERNAL_SOURCES.map((s) => (
          <ExternalMetricsCard key={s.name} {...s} />
        ))}
      </div>
    </ProfileSection>
  );
}
