"use client";

import Link from "next/link";
import {
  DollarSign, TrendingUp, Package, Users,
} from "lucide-react";
import { AnalyticsCards } from "../shared/analytics-cards";
import { AnalyticsChartMock } from "../shared/analytics-chart-mock";
import { AIInsightsPanel } from "../shared/ai-insights-panel";
import { ProfileSection, ProfileList } from "../shared/smart-widgets";
import {
  PARTNER_EXECUTIVE_METRICS, PARTNER_SALES_CHART, PARTNER_FINANCIAL,
  PARTNER_ACCOUNTING, PARTNER_LEGAL, PARTNER_MARKETING, PARTNER_STOCK,
  PARTNER_RH, PARTNER_AI_INSIGHTS, PARTNER_BI_CHARTS,
} from "@/lib/profile/defaults/partner";
import { IntegrationsHub } from "@/components/integrations/integrations-hub";
import { PartnerRobotsPanel } from "@/components/integrations/robot-hub";
import { PartnerProductManager } from "@/components/ecosystem/partner/partner-product-manager";
import { PartnerServiceManager } from "@/components/ecosystem/partner/partner-service-manager";
import { QualityControlPanel } from "@/components/ecosystem/partner/quality-control-panel";
import { AccessManagementPanel } from "@/components/ecosystem/partner/access-management-panel";
import { SupplierManagementPanel } from "@/components/ecosystem/partner/supplier-management-panel";
import { ChatHub } from "@/components/ecosystem/chat/chat-hub";
import { EcoPetInsightsDashboard } from "@/components/ecosystem/insights/ecopet-insights-dashboard";
import { QuoteBuilder } from "@/components/ecosystem/quotes/quote-builder";
import { CustomQuoteCard } from "@/components/ecosystem/quotes/custom-quote-card";
import { getQuotesForPartner } from "@/lib/ecosystem/quotes-api";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3, FileText } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { AdvisoryHub } from "@/components/advisory/advisory-hub";
import { PrivacyLgpdPanel, PersonaWorkflowPanel, PersonaExecutivePanel } from "@/components/platform/persona-panels";

export function PersonaDashboard() {
  const { t } = useTranslation();
  if (PARTNER_EXECUTIVE_METRICS.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t("empty.marketplace.noProducts")}
        description={t("empty.marketplace.noProductsHint")}
      />
    );
  }

  const topMetrics = PARTNER_EXECUTIVE_METRICS.slice(0, 8).map((m, i) => ({
    label: m.label,
    value: m.value,
    trend: m.trend,
    icon: [DollarSign, TrendingUp, Package, Users, DollarSign, TrendingUp, Users, TrendingUp][i],
    variant: (i === 0 ? "success" : "default") as "default" | "success",
  }));

  return (
    <div className="space-y-6">
      <AnalyticsCards items={topMetrics} columns={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChartMock title="Faturamento mensal (R$)" data={PARTNER_SALES_CHART} valuePrefix="R$ " />
        {PARTNER_AI_INSIGHTS.length > 0 && (
          <AIInsightsPanel insights={PARTNER_AI_INSIGHTS.slice(0, 2)} title="Central IA Empresarial" subtitle="Insights em tempo real" />
        )}
      </div>
      {PARTNER_EXECUTIVE_METRICS.length > 8 && (
        <AnalyticsCards items={PARTNER_EXECUTIVE_METRICS.slice(8).map(m => ({ label: m.label, value: m.value, trend: m.trend }))} columns={4} />
      )}
    </div>
  );
}

export function FinancialDashboard() {
  return (
    <div className="space-y-6">
      <ProfileSection title="Painel Financeiro" description="Fluxo de caixa, DRE visual e projeções">
        <ProfileList items={PARTNER_FINANCIAL} />
      </ProfileSection>
      <AnalyticsChartMock title="Receita vs Despesas" data={PARTNER_SALES_CHART} valuePrefix="R$ " />
    </div>
  );
}

export function BIAnalyticsPanel() {
  return (
    <div className="space-y-6">
      <ProfileSection title="BI & Analytics" description="Gráficos, comparativos e relatórios inteligentes">
        <div className="grid gap-4 lg:grid-cols-3">
          <AnalyticsChartMock title="Clientes ativos" data={PARTNER_BI_CHARTS.clients} />
          <AnalyticsChartMock title="Satisfação (★)" data={PARTNER_BI_CHARTS.satisfaction} />
          <AnalyticsChartMock title="Churn (%)" data={PARTNER_BI_CHARTS.churn} />
        </div>
      </ProfileSection>
    </div>
  );
}

export function AccountingPanel() {
  return <ProfileSection title="Painel Contábil"><ProfileList items={PARTNER_ACCOUNTING} /></ProfileSection>;
}

export function LegalDashboard() {
  return <ProfileSection title="Painel Jurídico" description="Contratos, LGPD e compliance"><ProfileList items={PARTNER_LEGAL} /></ProfileSection>;
}

export function MarketingDashboard() {
  return (
    <div className="space-y-6">
      <ProfileSection title="Painel de Marketing" description="Campanhas, tráfego e IA de conteúdo">
        <ProfileList items={PARTNER_MARKETING} />
      </ProfileSection>
      <AIInsightsPanel insights={PARTNER_AI_INSIGHTS.filter(i => i.tag === "Marketing" || i.tag === "Pricing")} title="IA de Marketing" />
    </div>
  );
}

export function AdminPanel() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Painel Administrativo" description="Gestão operacional e produtividade">
      <EmptyState icon={BarChart3} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
    </ProfileSection>
  );
}

export function StockDashboard() {
  return (
    <div className="space-y-6">
      <ProfileSection title="Painel de Estoque" description="Produtos, validade e IA de previsão">
        <ProfileList items={PARTNER_STOCK} />
      </ProfileSection>
      <AIInsightsPanel insights={PARTNER_AI_INSIGHTS.filter(i => i.tag === "Estoque")} title="IA de Estoque" />
    </div>
  );
}

export function AgendaPanel() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Painel de Agenda">
      <EmptyState icon={BarChart3} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
    </ProfileSection>
  );
}

export function RHPanel() {
  return <ProfileSection title="Painel RH"><ProfileList items={PARTNER_RH} /></ProfileSection>;
}

export function TIPanel() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Painel TI" description="Integrações, APIs e monitoramento">
      <EmptyState icon={BarChart3} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
    </ProfileSection>
  );
}

export function InnovationPanel() {
  const { t } = useTranslation();
  return (
    <ProfileSection title="Painel de Inovação" description="Ideias, roadmap e IA experimental">
      <EmptyState icon={BarChart3} title={t("empty.admin.noData")} description={t("empty.admin.noData")} />
    </ProfileSection>
  );
}

export function PartnerAIModule() {
  return <AIInsightsPanel insights={PARTNER_AI_INSIGHTS} title="Central IA Empresarial" subtitle="Análise, previsões e automações" />;
}

export function PartnerProductsModule() {
  return <PartnerProductManager />;
}

export function PartnerServicesModule() {
  return <PartnerServiceManager />;
}

export function PartnerQuotesModule() {
  const { t } = useTranslation();
  const quotes = getQuotesForPartner("mp1");
  return (
    <div className="space-y-6">
      <QuoteBuilder partnerId="mp1" partnerName="" />
      {quotes.length === 0 ? (
        <EmptyState icon={FileText} title={t("empty.quotes.noQuotes")} description={t("empty.quotes.noQuotesHint")} />
      ) : (
        quotes.map((q) => <CustomQuoteCard key={q.id} quote={q} />)
      )}
    </div>
  );
}

export function PartnerQualityModule() {
  return <QualityControlPanel />;
}

export function PartnerChatsModule() {
  return <ChatHub role="partner" />;
}

export function PartnerAccessModule() {
  return <AccessManagementPanel />;
}

export function PartnerSuppliersModule() {
  return <SupplierManagementPanel />;
}

export function PartnerInsightsModule() {
  return <EcoPetInsightsDashboard scope="partner" />;
}

export function PartnerAssessoriaModule() {
  return <AdvisoryHub variant="partner" />;
}

export function AgropetModule() {
  return (
    <ProfileSection title="AGROPET — Linha de Negócio" description="Agro inteligente integrado ao ecossistema parceiro" action={{ label: "Abrir Agro", href: "/agro" }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Agro Inteligente", href: "/agro", desc: "Dashboard central" },
          { label: "IoT Rural", href: "/agro/iot", desc: "Sensores e dispositivos" },
          { label: "Robôs", href: "/agro/robos", desc: "Automação de campo" },
          { label: "Drones", href: "/agro/drones", desc: "Monitoramento aéreo" },
          { label: "Produção", href: "/agro/producao", desc: "Gestão produtiva" },
          { label: "Pecuária", href: "/agro/rebanho", desc: "Rebanho e saúde" },
          { label: "Analytics", href: "/agro/analises", desc: "BI agro" },
          { label: "IA Agro", href: "/agro/ia", desc: "Recomendações ML" },
          { label: "Marketplace Agro", href: "/agro/marketplace", desc: "Produtos rurais" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-[16px] border border-ecopet-green/20 bg-ecopet-green/5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="font-semibold text-ecopet-green">{item.label}</p>
            <p className="caption-text mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </ProfileSection>
  );
}

export function renderPartnerModule(moduleId: string) {
  switch (moduleId) {
    case "overview": return <PersonaDashboard />;
    case "products": return <PartnerProductsModule />;
    case "services": return <PartnerServicesModule />;
    case "quotes": return <PartnerQuotesModule />;
    case "quality": return <PartnerQualityModule />;
    case "chats": return <PartnerChatsModule />;
    case "access": return <PartnerAccessModule />;
    case "suppliers": return <PartnerSuppliersModule />;
    case "insights": return <PartnerInsightsModule />;
    case "bi": return <BIAnalyticsPanel />;
    case "financial": return <FinancialDashboard />;
    case "accounting": return <AccountingPanel />;
    case "legal": return <LegalDashboard />;
    case "marketing": return <MarketingDashboard />;
    case "admin": return <AdminPanel />;
    case "stock": return <StockDashboard />;
    case "agenda": return <AgendaPanel />;
    case "rh": return <RHPanel />;
    case "ti": return <TIPanel />;
    case "innovation": return <InnovationPanel />;
    case "agropet": return <AgropetModule />;
    case "assessoria": return <PartnerAssessoriaModule />;
    case "integrations": return <IntegrationsHub profileCategory="PARTNER" />;
    case "robots24h": return <PartnerRobotsPanel />;
    case "privacy": return <PrivacyLgpdPanel persona="PARTNER" />;
    case "workflows": return <PersonaWorkflowPanel scope="PARTNER" />;
    case "monitoring": return <PersonaExecutivePanel persona="PARTNER" />;
    case "ai": return <PartnerAIModule />;
    default: return <PersonaDashboard />;
  }
}
