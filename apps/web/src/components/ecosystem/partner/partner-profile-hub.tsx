"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnerProfileContent } from "@/components/marketplace/partner-profile-content";
import { PartnerProductManager } from "./partner-product-manager";
import { PartnerServiceManager } from "./partner-service-manager";
import { QualityControlPanel } from "./quality-control-panel";
import { AccessManagementPanel } from "./access-management-panel";
import { SupplierManagementPanel } from "./supplier-management-panel";
import { ChatHub } from "../chat/chat-hub";
import { EcoPetInsightsDashboard } from "../insights/ecopet-insights-dashboard";
import { CustomQuoteCard } from "../quotes/custom-quote-card";
import { QuoteBuilder } from "../quotes/quote-builder";
import { IntegrationsHub } from "@/components/integrations/integrations-hub";
import { getQuotesForPartner } from "@/lib/ecosystem/quotes-api";
import { ProfileSection } from "@/components/profile/shared/smart-widgets";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

interface PartnerProfileHubProps {
  id: string;
  mode?: "public" | "manage";
}

export function PartnerProfileHub({ id, mode = "public" }: PartnerProfileHubProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "overview";
  const isManage = mode === "manage" || searchParams.get("manage") === "1";

  if (!isManage) {
    return <PartnerProfileContent id={id} expanded />;
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="products">Produtos</TabsTrigger>
        <TabsTrigger value="services">Serviços</TabsTrigger>
        <TabsTrigger value="custom">Personalizados</TabsTrigger>
        <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
        <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        <TabsTrigger value="quality">Qualidade</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="metrics">Métricas</TabsTrigger>
        <TabsTrigger value="access">Equipe</TabsTrigger>
        <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        <TabsTrigger value="integrations">Integrações</TabsTrigger>
        <TabsTrigger value="policies">Políticas</TabsTrigger>
        <TabsTrigger value="about">Sobre</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><PartnerProfileContent id={id} /></TabsContent>
      <TabsContent value="products"><PartnerProductManager /></TabsContent>
      <TabsContent value="services"><PartnerServiceManager /></TabsContent>
      <TabsContent value="custom" className="space-y-6">
        <QuoteBuilder partnerId={id} partnerName="Meu Parceiro" />
        <ProfileSection title="Orçamentos enviados">
          {getQuotesForPartner(id).length === 0 ? (
            <EmptyState icon={FileText} title={t("empty.quotes.noQuotes")} description={t("empty.quotes.noQuotesHint")} />
          ) : (
            getQuotesForPartner(id).map((q) => (
              <CustomQuoteCard key={q.id} quote={q} />
            ))
          )}
        </ProfileSection>
      </TabsContent>
      <TabsContent value="portfolio"><PartnerProfileContent id={id} tabOnly="portfolio" /></TabsContent>
      <TabsContent value="reviews"><PartnerProfileContent id={id} tabOnly="reviews" /></TabsContent>
      <TabsContent value="quality"><QualityControlPanel /></TabsContent>
      <TabsContent value="chat"><ChatHub role="partner" /></TabsContent>
      <TabsContent value="metrics"><EcoPetInsightsDashboard scope="partner" /></TabsContent>
      <TabsContent value="access"><AccessManagementPanel /></TabsContent>
      <TabsContent value="suppliers"><SupplierManagementPanel /></TabsContent>
      <TabsContent value="integrations"><IntegrationsHub profileCategory="PARTNER" /></TabsContent>
      <TabsContent value="policies"><PartnerProfileContent id={id} tabOnly="policies" /></TabsContent>
      <TabsContent value="about"><PartnerProfileContent id={id} tabOnly="about" /></TabsContent>
    </Tabs>
  );
}
