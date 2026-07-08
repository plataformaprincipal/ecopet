import { PLATFORM_EVENTS } from "@/lib/events/event-types";
import type { WorkflowAction } from "./workflow-types";

export type AutomationTemplateSeed = {
  slug: string;
  name: string;
  description?: string;
  triggerEvent: string;
  isCritical?: boolean;
  actions: WorkflowAction[];
};

export const DEFAULT_AUTOMATION_TEMPLATES: AutomationTemplateSeed[] = [
  {
    slug: "partner-approved",
    name: "Novo parceiro aprovado",
    description: "E-mail, notificação, checklist e auditoria",
    triggerEvent: PLATFORM_EVENTS.PARTNER_APPROVED,
    actions: [
      { type: "send_email", config: { subject: "Conta aprovada — EcoPet" } },
      { type: "send_notification", config: { title: "Conta aprovada", message: "Seu painel parceiro está liberado." } },
      { type: "create_task", config: { title: "Checklist onboarding parceiro" } },
      { type: "create_audit_log", config: { resource: "Partner", observation: "Onboarding automático" } },
    ],
  },
  {
    slug: "ong-approved",
    name: "Nova ONG aprovada",
    triggerEvent: PLATFORM_EVENTS.ONG_APPROVED,
    actions: [
      { type: "send_email", config: { subject: "ONG aprovada — EcoPet" } },
      { type: "send_notification", config: { title: "ONG aprovada", message: "Painel ONG liberado." } },
      { type: "create_task", config: { title: "Checklist onboarding ONG" } },
      { type: "create_audit_log", config: { resource: "ONG" } },
    ],
  },
  {
    slug: "order-paid",
    name: "Pedido pago",
    triggerEvent: PLATFORM_EVENTS.ORDER_PAID,
    actions: [
      { type: "send_notification", config: { title: "Pagamento confirmado", message: "Seu pedido foi pago." } },
      { type: "create_audit_log", config: { resource: "Order", observation: "Pedido pago" } },
      { type: "generate_report", config: { type: "analytics" }, continueOnError: true },
    ],
  },
  {
    slug: "payment-failed",
    name: "Pagamento falhou",
    triggerEvent: PLATFORM_EVENTS.PAYMENT_FAILED,
    isCritical: true,
    actions: [
      { type: "send_notification", config: { title: "Falha no pagamento", message: "Tente novamente ou altere o método." } },
      { type: "create_task", config: { title: "Alerta financeiro — pagamento falhou" } },
      { type: "create_audit_log", config: { resource: "Payment" } },
    ],
  },
  {
    slug: "post-reported",
    name: "Post denunciado",
    triggerEvent: PLATFORM_EVENTS.POST_REPORTED,
    actions: [
      { type: "create_task", config: { title: "Revisar denúncia de post" } },
      { type: "send_notification", config: { title: "Nova denúncia social" } },
      { type: "call_ai", config: { agentId: "admin", prompt: "Classifique severidade da denúncia" }, continueOnError: true },
      { type: "create_audit_log", config: { resource: "SocialReport" } },
    ],
  },
  {
    slug: "product-stock-low",
    name: "Estoque crítico",
    triggerEvent: PLATFORM_EVENTS.PRODUCT_STOCK_LOW,
    actions: [
      { type: "send_notification", config: { title: "Estoque baixo" } },
      { type: "call_ai", config: { agentId: "admin", prompt: "Sugerir recompra de estoque" }, continueOnError: true },
    ],
  },
  {
    slug: "adoption-approved",
    name: "Adoção aprovada",
    triggerEvent: PLATFORM_EVENTS.ADOPTION_APPROVED,
    actions: [
      { type: "send_notification", config: { title: "Adoção aprovada" } },
      { type: "create_task", config: { title: "Acompanhamento pós-adoção" } },
      { type: "create_audit_log", config: { resource: "Adoption" } },
    ],
  },
  {
    slug: "donation-received",
    name: "Doação recebida",
    triggerEvent: PLATFORM_EVENTS.DONATION_RECEIVED,
    actions: [
      { type: "send_notification", config: { title: "Doação recebida — obrigado!" } },
      { type: "create_audit_log", config: { resource: "Donation" } },
    ],
  },
  {
    slug: "integration-failed",
    name: "Integração falhou",
    triggerEvent: PLATFORM_EVENTS.INTEGRATION_FAILED,
    isCritical: true,
    actions: [
      { type: "create_task", config: { title: "Alerta técnico — integração" } },
      { type: "send_notification", config: { title: "Falha de integração" } },
      { type: "create_audit_log", config: { resource: "Integration" } },
    ],
  },
  {
    slug: "ai-request-failed",
    name: "IA falhou",
    triggerEvent: PLATFORM_EVENTS.AI_REQUEST_FAILED,
    actions: [
      { type: "create_audit_log", config: { resource: "AI" } },
      { type: "create_task", config: { title: "Investigar falha recorrente de IA" }, continueOnError: true },
    ],
  },
];
