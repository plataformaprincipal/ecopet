import type { UserRole } from "@prisma/client";

export type AutomationEventType =
  | "user.registered"
  | "cart.abandoned"
  | "order.created"
  | "payment.failed"
  | "appointment.upcoming"
  | "vaccine.due_soon"
  | "stock.low"
  | "partner.pending_approval"
  | "ngo.campaign_deadline"
  | "integration.failure"
  | "ai.budget_warning";

export type AutomationRule = {
  id: string;
  event: AutomationEventType;
  name: string;
  description: string;
  roles: UserRole[];
  risk: "low" | "medium" | "high";
  requiresConfirmation: boolean;
  channels: Array<"in_app" | "push" | "email" | "admin_alert">;
  enabledByFlag: "automations" | "smart_notifications";
};

export const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "client_cart_abandoned",
    event: "cart.abandoned",
    name: "Carrinho abandonado",
    description: "Lembra o cliente de itens no carrinho (in-app).",
    roles: ["CLIENT", "TUTOR"],
    risk: "low",
    requiresConfirmation: false,
    channels: ["in_app"],
    enabledByFlag: "smart_notifications",
  },
  {
    id: "client_vaccine_due",
    event: "vaccine.due_soon",
    name: "Vacina próxima",
    description: "Alerta de vacina cadastrada próxima do vencimento.",
    roles: ["CLIENT", "TUTOR"],
    risk: "low",
    requiresConfirmation: false,
    channels: ["in_app"],
    enabledByFlag: "smart_notifications",
  },
  {
    id: "partner_stock_low",
    event: "stock.low",
    name: "Estoque baixo",
    description: "Alerta o parceiro sobre produto com estoque baixo.",
    roles: ["PARTNER"],
    risk: "low",
    requiresConfirmation: false,
    channels: ["in_app", "admin_alert"],
    enabledByFlag: "automations",
  },
  {
    id: "admin_integration_failure",
    event: "integration.failure",
    name: "Falha de integração",
    description: "Alerta admin sobre falha crítica de integração.",
    roles: ["ADMIN"],
    risk: "medium",
    requiresConfirmation: false,
    channels: ["admin_alert", "in_app"],
    enabledByFlag: "automations",
  },
  {
    id: "admin_ai_budget",
    event: "ai.budget_warning",
    name: "Orçamento IA",
    description: "Alerta quando consumo de IA se aproxima do budget.",
    roles: ["ADMIN"],
    risk: "low",
    requiresConfirmation: false,
    channels: ["admin_alert"],
    enabledByFlag: "automations",
  },
];

export function listAutomationRules(): AutomationRule[] {
  return AUTOMATION_RULES;
}

export function getAutomationRule(id: string): AutomationRule | null {
  return AUTOMATION_RULES.find((r) => r.id === id) ?? null;
}

export function listRulesForEvent(event: AutomationEventType): AutomationRule[] {
  return AUTOMATION_RULES.filter((r) => r.event === event);
}
