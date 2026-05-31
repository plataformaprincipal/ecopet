"use client";

import { AIInsightsPanel } from "../shared/ai-insights-panel";
import { ProfileSection, ProfileList, SmartWidgets } from "../shared/smart-widgets";
import { RealtimeIndicators } from "../shared/realtime-indicators";
import { IntegrationsHub } from "@/components/integrations/integrations-hub";
import { NGORobotsPanel } from "@/components/integrations/robot-hub";
import { NGOFunctionalDashboard } from "@/components/ecosystem/dashboards/ngo-functional-dashboard";
import { ChatHub } from "@/components/ecosystem/chat/chat-hub";
import { EcoPetInsightsDashboard } from "@/components/ecosystem/insights/ecopet-insights-dashboard";
import { AccessManagementPanel } from "@/components/ecosystem/partner/access-management-panel";
import { AdvisoryHub } from "@/components/advisory/advisory-hub";
import { PrivacyLgpdPanel, PersonaWorkflowPanel, PersonaExecutivePanel } from "@/components/platform/persona-panels";
import {
  NGO_SOCIAL, NGO_RESCUE, NGO_DONATIONS, NGO_OPERATIONS,
  NGO_AI_INSIGHTS, NGO_WIDGETS, NGO_IMPACT,
} from "@/lib/profile/mock-data/ngo.mock";

export function NGOOverviewModule() {
  return (
    <div className="space-y-6">
      <RealtimeIndicators items={[
        { label: "Resgates", value: "2 urgentes", status: "warning" },
        { label: "Adoções", value: "3 pendentes", status: "online" },
        { label: "Doações", value: "78% meta", status: "online" },
      ]} />
      <SmartWidgets widgets={NGO_WIDGETS} />
      <ProfileSection title="Impacto social & transparência">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <div className="rounded-[16px] bg-ecopet-green/10 p-3 text-center"><p className="font-display text-xl font-extrabold">{NGO_IMPACT.adoptions2026}</p><p className="caption-text">Adoções 2026</p></div>
          <div className="rounded-[16px] bg-ecopet-green/10 p-3 text-center"><p className="font-display text-xl font-extrabold">{NGO_IMPACT.livesSaved}</p><p className="caption-text">Vidas resgatadas</p></div>
          <div className="rounded-[16px] bg-ecopet-yellow/10 p-3 text-center"><p className="font-display text-xl font-extrabold">{NGO_IMPACT.donationsTotal}</p><p className="caption-text">Arrecadado</p></div>
          <div className="rounded-[16px] bg-ecopet-green/10 p-3 text-center"><p className="font-display text-xl font-extrabold">{NGO_IMPACT.transparencyScore}</p><p className="caption-text">Transparência</p></div>
        </div>
        <ProfileList items={NGO_IMPACT.reports.map((r) => ({ label: r.title, value: r.status, badge: r.date }))} />
      </ProfileSection>
      <AIInsightsPanel insights={NGO_AI_INSIGHTS.slice(0, 2)} title="IA Social ONG" />
    </div>
  );
}

export function NGOSocialModule() {
  return (
    <ProfileSection title="Área Social" description="Feed, campanhas, adoções e eventos">
      <ProfileList items={NGO_SOCIAL} />
    </ProfileSection>
  );
}

export function NGOOperationsPanel() {
  return (
    <ProfileSection title="Área Operacional" description="Voluntários, agenda e processos">
      <ProfileList items={NGO_OPERATIONS} />
    </ProfileSection>
  );
}

export function NGORescueModule() {
  return (
    <div className="space-y-6">
      <ProfileSection title="Área de Resgate" description="Animais resgatados, triagem e adoção">
        <ProfileList items={NGO_RESCUE} />
      </ProfileSection>
      <AIInsightsPanel insights={NGO_AI_INSIGHTS.filter(i => i.tag === "Resgate" || i.tag === "Adoção")} title="IA de Risco e Adoção" />
    </div>
  );
}

export function NGODonationsModule() {
  return (
    <ProfileSection title="Área de Doações" description="Arrecadação, metas e transparência">
      <ProfileList items={NGO_DONATIONS} />
    </ProfileSection>
  );
}

export function NGOAIModule() {
  return <AIInsightsPanel insights={NGO_AI_INSIGHTS} title="IA Social / ONG" subtitle="Campanhas, adoção e engajamento" />;
}

export function NGODashboardModule() {
  return <NGOFunctionalDashboard />;
}

export function NGOChatsModule() {
  return <ChatHub role="ngo" />;
}

export function NGOInsightsModule() {
  return <EcoPetInsightsDashboard scope="ngo" />;
}

export function NGOAccessModule() {
  return <AccessManagementPanel />;
}

export function NGOAssessoriaModule() {
  return <AdvisoryHub variant="ngo" />;
}

export function renderNGOModule(moduleId: string) {
  switch (moduleId) {
    case "overview": return <NGOOverviewModule />;
    case "dashboard": return <NGODashboardModule />;
    case "social": return <NGOSocialModule />;
    case "chats": return <NGOChatsModule />;
    case "insights": return <NGOInsightsModule />;
    case "access": return <NGOAccessModule />;
    case "rescue": return <NGORescueModule />;
    case "donations": return <NGODonationsModule />;
    case "operations": return <NGOOperationsPanel />;
    case "assessoria": return <NGOAssessoriaModule />;
    case "integrations": return <IntegrationsHub profileCategory="NGO" />;
    case "robots24h": return <NGORobotsPanel />;
    case "privacy": return <PrivacyLgpdPanel persona="NGO" />;
    case "workflows": return <PersonaWorkflowPanel scope="NGO" />;
    case "monitoring": return <PersonaExecutivePanel persona="NGO" />;
    case "ai": return <NGOAIModule />;
    default: return <NGOOverviewModule />;
  }
}
