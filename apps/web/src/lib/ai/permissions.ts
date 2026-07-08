import { UserRole } from "@prisma/client";
import type { AiAgentId, AiIntegrationPointId } from "@/lib/ai/types";
import { getAgent, listAgents } from "@/lib/ai/registry";

/** Normaliza papéis legados para a matriz AI-First. */
export function normalizeAiRole(role: UserRole): UserRole {
  if (role === UserRole.TUTOR) return UserRole.CLIENT;
  if (role === UserRole.GESTOR) return UserRole.ADMIN;
  return role;
}

const INTEGRATION_DEFAULT_AGENT: Record<AiIntegrationPointId, AiAgentId> = {
  dashboard: "client",
  marketplace: "marketplace",
  pet: "pet",
  agenda: "veterinarian",
  chat: "support",
  social: "client",
  profile: "client",
  partner: "partner",
  ngo: "ngo",
  admin: "admin",
};

const ROLE_DEFAULT_AGENT: Partial<Record<UserRole, AiAgentId>> = {
  [UserRole.CLIENT]: "client",
  [UserRole.PARTNER]: "partner",
  [UserRole.ONG]: "ngo",
  [UserRole.ADMIN]: "admin",
  [UserRole.TUTOR]: "client",
  [UserRole.GESTOR]: "admin",
};

function defaultAgentForRole(role: UserRole): AiAgentId {
  if (ROLE_DEFAULT_AGENT[role]) return ROLE_DEFAULT_AGENT[role]!;
  return normalizeAiRole(role) === UserRole.ADMIN ? "admin" : "client";
}

export function canAccessAgent(role: UserRole, agentId: AiAgentId): boolean {
  const agent = getAgent(agentId);
  if (!agent) return false;
  return agent.allowedRoles.includes(normalizeAiRole(role));
}

export function listAgentsForRole(role: UserRole) {
  const normalized = normalizeAiRole(role);
  return listAgents().filter((a) => a.allowedRoles.includes(normalized));
}

export function resolveAgentForRequest(params: {
  role: UserRole;
  agentId?: AiAgentId;
  integrationPoint?: AiIntegrationPointId;
}): AiAgentId | null {
  const role = normalizeAiRole(params.role);
  if (params.agentId) {
    return canAccessAgent(role, params.agentId) ? params.agentId : null;
  }
  if (params.integrationPoint) {
    const candidate = INTEGRATION_DEFAULT_AGENT[params.integrationPoint];
    return canAccessAgent(role, candidate) ? candidate : defaultAgentForRole(role);
  }
  return defaultAgentForRole(role);
}

export function assertAgentAccess(role: UserRole, agentId: AiAgentId): void {
  if (!canAccessAgent(role, agentId)) {
    throw new Error("AGENT_FORBIDDEN");
  }
}
