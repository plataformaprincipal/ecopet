/**
 * Agente central EcoPet IA — orquestra por perfil/página/módulo.
 * Não acessa Prisma diretamente; delega a modules/enterprise/assistant.
 */
import "server-only";

import type { UserRole } from "@prisma/client";
import { resolveAssistantPersona } from "@/lib/ai/assistant/personas";
import type { AssistantPersona } from "@/lib/ai/assistant/types";
import { planToolsFromMessage, detectModuleFromPage } from "@/lib/ai/modules/intent-router";
import type { BusinessModule } from "@/lib/ai/modules/types";
import { isAiFlagEnabled } from "./feature-flags";

export type EcoPetAgentId =
  | "central"
  | "client"
  | "partner"
  | "ngo"
  | "admin"
  | "marketplace"
  | "mypet"
  | "explore"
  | "support";

export type AgentPlan = {
  agentId: EcoPetAgentId;
  persona: AssistantPersona;
  businessModule: BusinessModule;
  intentTools: Array<{ name: string; params: Record<string, unknown> }>;
  flags: {
    tools: boolean;
    streaming: boolean;
    predictions: boolean;
  };
  disclaimer: string;
};

const DISCLAIMERS: Record<AssistantPersona, string> = {
  CLIENT:
    "Orientações gerais. Não substitui veterinário. Ações sensíveis exigem confirmação.",
  PARTNER:
    "Apoio operacional. Não altera financeiro/estoque sem confirmação e fluxo formal.",
  ONG: "Apoio a campanhas/adoção. Decisões de adoção permanecem humanas.",
  ADMIN: "Apoio à governança. Não suspende usuários nem altera secrets automaticamente.",
};

export function resolveEcoPetAgent(input: {
  role: UserRole;
  pagePath?: string;
  moduleHint?: string;
  message?: string;
}): AgentPlan {
  const persona = resolveAssistantPersona(input.role);
  const pageModule = detectModuleFromPage(input.pagePath);
  const intent = input.message
    ? planToolsFromMessage(input.message, persona)
    : { module: "general" as BusinessModule, tools: [] };

  const businessModule: BusinessModule =
    pageModule ??
    (input.moduleHint as BusinessModule | undefined) ??
    intent.module;

  let agentId: EcoPetAgentId = "central";
  if (persona === "PARTNER") agentId = "partner";
  else if (persona === "ONG") agentId = "ngo";
  else if (persona === "ADMIN") agentId = "admin";
  else if (
    businessModule === "marketplace" ||
    businessModule === "cart" ||
    businessModule === "orders"
  )
    agentId = "marketplace";
  else if (businessModule === "mypet") agentId = "mypet";
  else if (businessModule === "social" || intent.module === "social") agentId = "explore";
  else if (persona === "CLIENT") agentId = "client";

  return {
    agentId,
    persona,
    businessModule,
    intentTools: intent.tools.map((t) => ({ name: t.name, params: t.params })),
    flags: {
      tools: isAiFlagEnabled("tools"),
      streaming: isAiFlagEnabled("streaming"),
      predictions: isAiFlagEnabled("predictions"),
    },
    disclaimer: DISCLAIMERS[persona],
  };
}

export function agentAllowsSensitiveAction(agentId: EcoPetAgentId, action: string): boolean {
  const sensitive = [
    "refund",
    "suspend",
    "delete_user",
    "approve_payment",
    "publish",
    "adopt_approve",
    "wire_transfer",
  ];
  if (sensitive.some((s) => action.includes(s))) return false;
  if (agentId === "admin" && action.startsWith("draft_")) return true;
  return !action.startsWith("mutate_critical_");
}
