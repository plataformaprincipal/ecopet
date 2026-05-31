"use client";

import Image from "next/image";
import Link from "next/link";
import { PawPrint, Plus, QrCode, Heart, Trophy, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIInsightsPanel } from "../shared/ai-insights-panel";
import { ProfileSection, ProfileList, SmartWidgets } from "../shared/smart-widgets";
import { AnalyticsChartMock } from "../shared/analytics-chart-mock";
import {
  CLIENT_SOCIAL_FEED, CLIENT_PETS, CLIENT_INTELLIGENT_WIDGETS, CLIENT_AI_INSIGHTS,
  CLIENT_FINANCIAL, CLIENT_SERVICES, CLIENT_SETTINGS, CLIENT_CHART_DATA, CLIENT_SOCIAL_STATS,
  CLIENT_DIGITAL_LIFE,
} from "@/lib/profile/mock-data/client.mock";
import { cn } from "@/lib/utils";
import { IntegrationsHub } from "@/components/integrations/integrations-hub";
import { ClientRobotsPanel } from "@/components/integrations/robot-hub";
import { ClientFunctionalDashboard } from "@/components/ecosystem/dashboards/client-functional-dashboard";
import { ChatHub } from "@/components/ecosystem/chat/chat-hub";
import { WalletPanel } from "@/components/wallet/wallet-panel";
import { OrderTrackingPanel } from "@/components/orders/order-tracking-panel";
import { CustomQuoteCard } from "@/components/ecosystem/quotes/custom-quote-card";
import { EcoPetInsightsDashboard } from "@/components/ecosystem/insights/ecopet-insights-dashboard";
import { PrivacyLgpdPanel, PersonaWorkflowPanel, PersonaExecutivePanel } from "@/components/platform/persona-panels";
import { getQuotesForClient } from "@/lib/ecosystem/mock-data";
import { useMarketplaceStore } from "@/store/marketplace-store";

export function ClientOverviewModule() {
  return (
    <div className="space-y-6">
      <AIInsightsPanel insights={CLIENT_AI_INSIGHTS.slice(0, 2)} title="Resumo inteligente" />
      <ProfileSection title="Vida digital do pet" description="Timeline, conquistas e recompensas">
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div className="rounded-[16px] border border-ecopet-yellow/30 bg-ecopet-yellow/5 p-4 text-center">
            <Star className="mx-auto h-6 w-6 text-ecopet-yellow" />
            <p className="mt-1 font-display text-xl font-extrabold">{CLIENT_DIGITAL_LIFE.rewards.level}</p>
            <p className="caption-text">{CLIENT_DIGITAL_LIFE.rewards.points} pts · {CLIENT_DIGITAL_LIFE.rewards.cashback} cashback</p>
          </div>
          {CLIENT_DIGITAL_LIFE.activities.slice(0, 2).map((a) => (
            <div key={a.label} className="rounded-[16px] border border-ecopet-gray/10 bg-ecopet-gray/5 p-4 text-center dark:bg-white/5">
              <p className="font-display text-xl font-extrabold">{a.value}</p>
              <p className="caption-text">{a.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {CLIENT_DIGITAL_LIFE.timeline.map((t) => (
            <div key={t.date} className="flex items-center gap-3 rounded-xl border border-ecopet-gray/10 px-3 py-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-ecopet-green" />
              <span className="caption-text shrink-0">{t.date}</span>
              <span className="flex-1">{t.event}</span>
              <Badge variant="default" className="text-[10px]">{t.type}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {CLIENT_DIGITAL_LIFE.achievements.map((a) => (
            <div key={a.name} className={cn("rounded-xl p-3 text-center text-sm", a.unlocked ? "bg-ecopet-green/10" : "bg-ecopet-gray/5 opacity-60")}>
              <Trophy className={cn("mx-auto h-5 w-5", a.unlocked ? "text-ecopet-yellow" : "text-ecopet-gray")} />
              <p className="mt-1 font-semibold">{a.name}</p>
              <p className="caption-text">{a.desc}</p>
            </div>
          ))}
        </div>
      </ProfileSection>
      <ProfileSection title="Atividade social" action={{ label: "Ver feed", href: "/inicio" }}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CLIENT_SOCIAL_STATS.map((s) => (
            <div key={s.label} className="rounded-xl bg-ecopet-gray/5 p-3 text-center">
              <p className="font-bold">{s.value}</p>
              <p className="text-xs text-ecopet-gray">{s.label}</p>
            </div>
          ))}
        </div>
      </ProfileSection>
      <SmartWidgets widgets={CLIENT_INTELLIGENT_WIDGETS.slice(0, 4)} />
    </div>
  );
}

export function ClientSocialModule() {
  return (
    <ProfileSection title="Área Social" description="Feed, stories, comunidades e interações">
      <ProfileList items={CLIENT_SOCIAL_FEED} />
    </ProfileSection>
  );
}

export function PetCentral() {
  return (
    <ProfileSection title="Central dos Pets" description="Saúde, rotina e IA por animal" action={{ label: "Meu Pet", href: "/meu-pet" }}>
      <div className="grid gap-4 sm:grid-cols-2">
        {CLIENT_PETS.map((pet) => (
          <div key={pet.id} className="overflow-hidden rounded-2xl border border-ecopet-green/20 bg-white dark:bg-white/5">
            <div className="relative h-24 bg-gradient-to-r from-ecopet-dark to-ecopet-green" />
            <div className="relative px-4 pb-4">
              <div className="flex items-end gap-3 -mt-10">
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-white shadow">
                  <Image src={pet.photo} alt={pet.name} fill className="object-cover" />
                </div>
                <div className="flex-1 pb-1">
                  <h3 className="font-bold">{pet.name}</h3>
                  <p className="text-xs text-ecopet-gray">{pet.breed} · {pet.age}</p>
                </div>
                <Button size="icon" variant="outline" className="h-8 w-8"><QrCode className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{pet.weight}</Badge>
                <Badge className="bg-ecopet-green/10 text-ecopet-green"><Heart className="mr-1 h-3 w-3" />{pet.healthStatus}</Badge>
              </div>
              <Link href="/meu-pet" className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">Abrir prontuário</Button>
              </Link>
            </div>
          </div>
        ))}
        <Link href="/onboarding/pet" className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-ecopet-green/30 p-6 text-center transition-colors hover:bg-ecopet-green/5">
          <PawPrint className="h-10 w-10 text-ecopet-green" />
          <p className="mt-2 font-semibold">Cadastrar pet</p>
          <Button size="sm" className="mt-3"><Plus className="h-4 w-4" /> Novo pet</Button>
        </Link>
      </div>
    </ProfileSection>
  );
}

export function ClientIntelligentModule() {
  return (
    <div className="space-y-6">
      <ProfileSection title="Painel Inteligente do Cliente" description="Insights, hábitos e bem-estar">
        <SmartWidgets widgets={CLIENT_INTELLIGENT_WIDGETS} columns={3} />
      </ProfileSection>
      <AnalyticsChartMock title="Gastos mensais (R$)" data={CLIENT_CHART_DATA} valuePrefix="R$ " />
      <AIInsightsPanel insights={CLIENT_AI_INSIGHTS} title="IA ECOPET — Recomendações personalizadas" />
    </div>
  );
}

export function ClientFinancialModule() {
  return (
    <div className="space-y-6">
      <WalletPanel />
      <ProfileSection title="Meus pedidos" description="Acompanhamento de entrega e retirada">
        <OrderTrackingPanel />
      </ProfileSection>
    </div>
  );
}

export function ClientServicesModule() {
  return (
    <ProfileSection title="Serviços contratados" action={{ label: "Marketplace", href: "/marketplace/servicos" }}>
      <ProfileList items={CLIENT_SERVICES} />
    </ProfileSection>
  );
}

export function ClientSettingsModule() {
  return (
    <ProfileSection title="Configurações" action={{ label: "Abrir configurações", href: "/configuracoes" }}>
      <ProfileList items={CLIENT_SETTINGS} />
    </ProfileSection>
  );
}

export function ClientIntegrationsModule() {
  return <IntegrationsHub profileCategory="CLIENT" />;
}

export function ClientRobotsModule() {
  return <ClientRobotsPanel />;
}

export function ClientDashboardModule() {
  return <ClientFunctionalDashboard />;
}

export function ClientQuotesModule() {
  const { addQuoteToCart } = useMarketplaceStore();
  const quotes = getQuotesForClient();
  return (
    <ProfileSection title="Meus orçamentos" action={{ label: "Ver todos", href: "/marketplace/orcamentos" }}>
      <div className="space-y-4">
        {quotes.map((q) => <CustomQuoteCard key={q.id} quote={q} onAddToCart={addQuoteToCart} compact />)}
      </div>
    </ProfileSection>
  );
}

export function ClientChatsModule() {
  return <ChatHub role="client" />;
}

export function ClientInsightsModule() {
  return <EcoPetInsightsDashboard scope="client" />;
}

export function ClientPrivacyModule() {
  return <PrivacyLgpdPanel persona="CLIENT" />;
}

export function ClientWorkflowsModule() {
  return <PersonaWorkflowPanel scope="CLIENT" />;
}

export function renderClientModule(moduleId: string) {
  switch (moduleId) {
    case "overview": return <ClientOverviewModule />;
    case "dashboard": return <ClientDashboardModule />;
    case "social": return <ClientSocialModule />;
    case "pets": return <PetCentral />;
    case "quotes": return <ClientQuotesModule />;
    case "chats": return <ClientChatsModule />;
    case "insights": return <ClientInsightsModule />;
    case "intelligent": return <ClientIntelligentModule />;
    case "financial": return <ClientFinancialModule />;
    case "services": return <ClientServicesModule />;
    case "integrations": return <ClientIntegrationsModule />;
    case "robots24h": return <ClientRobotsModule />;
    case "privacy": return <ClientPrivacyModule />;
    case "workflows": return <ClientWorkflowsModule />;
    case "settings": return <ClientSettingsModule />;
    default: return <ClientOverviewModule />;
  }
}
