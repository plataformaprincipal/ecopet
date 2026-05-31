import type { IntegrationCategory } from "./types";

export const INTEGRATION_CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: "social", label: "Redes sociais" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sites", label: "Sites" },
  { id: "marketplaces", label: "Marketplaces" },
  { id: "payments", label: "Pagamentos" },
  { id: "erp", label: "ERPs" },
  { id: "crm", label: "CRMs" },
  { id: "agenda", label: "Agenda" },
  { id: "email", label: "E-mail" },
  { id: "sms", label: "SMS" },
  { id: "storage", label: "Armazenamento" },
  { id: "bi", label: "BI" },
  { id: "ai", label: "IA" },
  { id: "iot", label: "IoT" },
  { id: "robots", label: "Robôs" },
  { id: "agropet", label: "AgroPet" },
  { id: "health", label: "Saúde" },
  { id: "financial", label: "Financeiro" },
  { id: "legal", label: "Jurídico" },
  { id: "accounting", label: "Contábil" },
  { id: "marketing", label: "Marketing" },
];

export const AUTONOMY_LABELS: Record<string, string> = {
  monitoring: "Apenas monitoramento",
  suggestion: "Sugestão",
  approval_required: "Execução com aprovação",
  auto_limited: "Automático limitado",
  auto_full: "Automático completo",
};

export const ROBOT_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  error: "Erro",
  awaiting_config: "Aguardando configuração",
};

export const INTEGRATION_STATUS_LABELS: Record<string, string> = {
  connected: "Conectado",
  disconnected: "Desconectado",
  pending: "Pendente",
  error: "Erro",
};
