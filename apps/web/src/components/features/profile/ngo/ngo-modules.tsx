"use client";

import { Heart } from "lucide-react";
import { AIInsightsPanel } from "../shared/ai-insights-panel";
import { ProfileSection, ProfileList, SmartWidgets } from "../shared/smart-widgets";
import { EmptyState } from "@/components/ui/empty-state";
import { IntegrationsHub } from "@/components/features/integrations/integrations-hub";
import { NGORobotsPanel } from "@/components/features/integrations/robot-hub";
import { NGOFunctionalDashboard } from "@/components/features/ecosystem/dashboards/ngo-functional-dashboard";
import { ChatHub } from "@/components/features/ecosystem/chat/chat-hub";
import { EcoPetInsightsDashboard } from "@/components/features/ecosystem/insights/ecopet-insights-dashboard";
import { AccessManagementPanel } from "@/components/features/ecosystem/partner/access-management-panel";
import { AdvisoryHub } from "@/components/features/advisory/advisory-hub";
import { PrivacyLgpdPanel, PersonaWorkflowPanel, PersonaExecutivePanel } from "@/components/features/platform/persona-panels";
import {
  NGO_SOCIAL, NGO_RESCUE, NGO_DONATIONS, NGO_OPERATIONS,
  NGO_AI_INSIGHTS, NGO_WIDGETS, NGO_IMPACT,
} from "@/lib/profile/defaults/ngo";
import { useTranslation } from "@/providers/i18n-provider";

export function NGOOverviewModule() {
  const { t } = useTranslation();
  const hasData =
    NGO_WIDGETS.length > 0 ||
    NGO_IMPACT.reports.length > 0 ||
    NGO_AI_INSIGHTS.length > 0 ||
    NGO_IMPACT.adoptions2026 > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={Heart}
        title={t("empty.campaigns.title")}
        description={t("empty.campaigns.description")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {NGO_WIDGETS.length > 0 && <SmartWidgets widgets={NGO_WIDGETS} />}
      {NGO_IMPACT.reports.length > 0 && (
        <ProfileSection title="Impacto social & transparência">
          <ProfileList items={NGO_IMPACT.reports.map((r) => ({ label: r.title, value: r.status, badge: r.date }))} />
        </ProfileSection>
      )}
      {NGO_AI_INSIGHTS.length > 0 && (
        <AIInsightsPanel insights={NGO_AI_INSIGHTS.slice(0, 2)} title="IA Social ONG" />
      )}
    </div>
  );
}

export function NGOSocialModule() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Área Social" description="Feed, campanhas, adoções e eventos">
      {NGO_SOCIAL.length === 0 ? (
        <EmptyState icon={Heart} title={t("empty.posts.title")} description={t("empty.posts.description")} />
      ) : (
        <ProfileList items={NGO_SOCIAL} />
      )}
    </ProfileSection>
  );
}

export function NGOOperationsPanel() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Área Operacional" description="Voluntários, agenda e processos">
      {NGO_OPERATIONS.length === 0 ? (
        <EmptyState icon={Heart} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
      ) : (
        <ProfileList items={NGO_OPERATIONS} />
      )}
    </ProfileSection>
  );
}

export function NGORescueModule() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ProfileSection title="Área de Resgate" description="Animais resgatados, triagem e adoção">
        {NGO_RESCUE.length === 0 ? (
          <EmptyState icon={Heart} title={t("empty.pets.title")} description={t("empty.pets.description")} />
        ) : (
          <ProfileList items={NGO_RESCUE} />
        )}
      </ProfileSection>
      {NGO_AI_INSIGHTS.length > 0 && (
        <AIInsightsPanel insights={NGO_AI_INSIGHTS.filter(i => i.tag === "Resgate" || i.tag === "Adoção")} title="IA de Risco e Adoção" />
      )}
    </div>
  );
}

export function NGODonationsModule() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Área de Doações" description="Arrecadação, metas e transparência">
      {NGO_DONATIONS.length === 0 ? (
        <EmptyState icon={Heart} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
      ) : (
        <ProfileList items={NGO_DONATIONS} />
      )}
    </ProfileSection>
  );
}

export function NGOAIModule() {
  const { t } = useTranslation();
  return NGO_AI_INSIGHTS.length === 0 ? (
    <EmptyState icon={Heart} title={t("empty.ai.noHistory")} description={t("empty.ai.noHistory")} />
  ) : (
    <AIInsightsPanel insights={NGO_AI_INSIGHTS} title="IA Social / ONG" subtitle="Campanhas, adoção e engajamento" />
  );
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
