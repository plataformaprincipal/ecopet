"use client";

import { ClientPageHeader } from "../client-page-header";
import { ClientAssistantChat } from "../assistant/client-assistant-chat";

export function ClientAssistentePage() {
  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Assistente Inteligente"
        description="Pergunte sobre saúde, rotina, produtos, serviços, compras, agenda, financeiro e documentos."
      />
      <ClientAssistantChat />
    </div>
  );
}
