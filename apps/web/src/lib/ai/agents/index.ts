import { UserRole } from "@prisma/client";
import type { AiAgentDefinition, AiAgentId, AiIntegrationPointId } from "@/lib/ai/types";
import { registerAgent } from "@/lib/ai/registry";

function defineAgent(
  id: AiAgentId,
  name: string,
  description: string,
  allowedRoles: readonly UserRole[],
  integrationPoints: readonly AiIntegrationPointId[],
  toolIds: string[] = [],
  temperature = 0.7
): AiAgentDefinition {
  return {
    id,
    name,
    description,
    allowedRoles,
    defaultModelId: id === "admin" || id === "analytics" ? "gpt-4o" : "gpt-4o-mini",
    temperature,
    promptKey: `agent.${id}`,
    promptVersion: "1.0.0",
    memoryScopes: id === "pet" ? ["user", "pet"] : id === "partner" ? ["user", "partner"] : id === "ngo" ? ["user", "ngo"] : id === "admin" ? ["user", "admin"] : ["user"],
    toolIds,
    integrationPoints,
    status: "ACTIVE",
  };
}

export function bootstrapAgentRegistry() {
  const agents: AiAgentDefinition[] = [
    defineAgent("client", "Tutor", "Assistente para tutores", [UserRole.CLIENT, UserRole.TUTOR], ["dashboard", "profile", "social"]),
    defineAgent("partner", "Parceiro", "Assistente para parceiros", [UserRole.PARTNER], ["partner", "dashboard", "agenda"], ["search-partners", "search-orders", "search-agenda"]),
    defineAgent("ngo", "ONG", "Assistente para ONGs", [UserRole.ONG], ["ngo", "dashboard"], ["search-ngos"]),
    defineAgent("admin", "Administrador", "Assistente administrativo", [UserRole.ADMIN, UserRole.GESTOR], ["admin", "dashboard"], ["search-profile"]),
    defineAgent("marketplace", "Marketplace", "Busca e recomendações", [UserRole.CLIENT, UserRole.PARTNER, UserRole.TUTOR], ["marketplace"], ["search-products", "search-marketplace"]),
    defineAgent("veterinarian", "Veterinário", "Saúde animal", [UserRole.CLIENT, UserRole.TUTOR], ["pet", "agenda"], ["search-pets"]),
    defineAgent("pet", "Meu Pet", "Assistente do pet", [UserRole.CLIENT, UserRole.TUTOR], ["pet"], ["search-pets"]),
    defineAgent("marketing", "Marketing", "Campanhas", [UserRole.PARTNER, UserRole.ONG, UserRole.ADMIN], ["dashboard", "social"]),
    defineAgent("finance", "Financeiro", "Indicadores financeiros", [UserRole.CLIENT, UserRole.TUTOR, UserRole.PARTNER, UserRole.ADMIN], ["dashboard"], ["search-finance"]),
    defineAgent("legal", "Jurídico", "Conformidade", [UserRole.ADMIN], ["admin"]),
    defineAgent("commercial", "Comercial", "CRM e vendas", [UserRole.PARTNER, UserRole.ADMIN], ["partner", "dashboard"]),
    defineAgent("support", "Suporte", "Atendimento", [UserRole.CLIENT, UserRole.PARTNER, UserRole.ONG, UserRole.ADMIN, UserRole.TUTOR], ["chat", "profile"]),
    defineAgent("analytics", "Analytics", "Métricas", [UserRole.PARTNER, UserRole.ONG, UserRole.ADMIN], ["dashboard", "admin"]),
  ];
  for (const a of agents) registerAgent(a);
}

bootstrapAgentRegistry();
