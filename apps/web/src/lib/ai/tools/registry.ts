import { UserRole } from "@prisma/client";
import type { AiToolDefinition, AiAgentId } from "@/lib/ai/types";

const tools = new Map<string, AiToolDefinition>();

export function registerTool(definition: AiToolDefinition) {
  tools.set(definition.id, definition);
}

export function getTool(toolId: string): AiToolDefinition | null {
  return tools.get(toolId) ?? null;
}

export function listTools(filter?: { agentId?: AiAgentId; role?: UserRole }) {
  return [...tools.values()].filter((t) => {
    if (filter?.agentId && !t.agentIds.includes(filter.agentId)) return false;
    if (filter?.role && !t.requiredRoles.includes(filter.role)) return false;
    return true;
  });
}

export function listToolsForAgent(agentId: AiAgentId, role: UserRole) {
  return listTools({ agentId, role });
}

/**
 * @deprecated Prefer `executeBusinessTool` / `runFunctionCallingLoop` (modules + enterprise).
 * Mantido para compatibilidade com agentes legados.
 */
export async function executeTool(toolId: string, _params: Record<string, unknown>) {
  const tool = getTool(toolId);
  if (!tool) return { toolId, result: null, executed: false };
  return {
    toolId,
    result: {
      status: "deprecated_stub",
      message: `Use modules/enterprise FC (consult_*). Stub legado: ${tool.name}.`,
    },
    executed: false,
  };
}

function tool(
  id: string,
  name: string,
  description: string,
  agentIds: AiAgentId[],
  roles: readonly UserRole[],
  parameters: AiToolDefinition["parameters"] = {}
): AiToolDefinition {
  return { id, name, description, agentIds, requiredRoles: roles, parameters, status: "ACTIVE" };
}

function bootstrapTools() {
  const clientRoles = [UserRole.CLIENT, UserRole.TUTOR] as const;
  const partnerRoles = [UserRole.PARTNER] as const;
  const adminRoles = [UserRole.ADMIN] as const;
  const allRoles = [UserRole.CLIENT, UserRole.PARTNER, UserRole.ONG, UserRole.ADMIN, UserRole.TUTOR] as const;

  [
    tool("search-products", "Buscar Produtos", "Busca produtos no marketplace", ["marketplace"], [...clientRoles, UserRole.PARTNER], { query: { type: "string", description: "Termo de busca", required: true } }),
    tool("search-pets", "Buscar Pets", "Lista pets do usuário", ["pet", "veterinarian"], [...clientRoles]),
    tool("search-partners", "Buscar Parceiros", "Dados do parceiro autenticado", ["partner"], [...partnerRoles]),
    tool("search-ngos", "Buscar ONGs", "Dados da ONG autenticada", ["ngo"], [UserRole.ONG]),
    tool("search-orders", "Buscar Pedidos", "Pedidos do usuário/parceiro", ["partner", "commercial"], [...partnerRoles, ...adminRoles]),
    tool("search-agenda", "Buscar Agenda", "Agendamentos", ["partner", "veterinarian"], [...partnerRoles, ...clientRoles]),
    tool("search-profile", "Buscar Perfil", "Perfil do usuário autenticado", ["admin", "support"], allRoles),
    tool("search-finance", "Buscar Financeiro", "Indicadores financeiros", ["finance"], [...partnerRoles, ...adminRoles]),
    tool("search-marketplace", "Buscar Marketplace", "Catálogo geral", ["marketplace"], allRoles),
  ].forEach(registerTool);
}

bootstrapTools();
