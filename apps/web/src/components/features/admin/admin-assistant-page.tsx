"use client";

import { ErpAssistantDrawer } from "@/components/features/admin/erp/erp-assistant-drawer";
import { AdminPageHeader } from "@/components/features/admin/ui/admin-page-header";

export function AdminAssistantPage() {
  return (
    <>
      <AdminPageHeader
        title="Assistente Executivo IA"
        description="Copiloto administrativo — perguntas respondidas com dados reais da plataforma."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Assistente IA" }]}
      />
      <div className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Use o assistente no canto superior direito ou clique abaixo para abrir o painel.
        </p>
        <ErpAssistantDrawer />
      </div>
    </>
  );
}
