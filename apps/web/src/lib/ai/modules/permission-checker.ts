import type { UserRole } from "@prisma/client";
import type { AssistantPersona } from "@/lib/ai/assistant/types";
import { resolveAssistantPersona } from "@/lib/ai/assistant/personas";
import type { BusinessToolDefinition, BusinessToolName } from "./types";

export function personaForRole(role: UserRole): AssistantPersona {
  return resolveAssistantPersona(role);
}

export function canPersonaUseTool(
  persona: AssistantPersona,
  tool: BusinessToolDefinition
): boolean {
  return tool.personas.includes(persona);
}

export function canRoleUseTool(role: UserRole, tool: BusinessToolDefinition): boolean {
  if (!tool.roles.includes(role)) return false;
  return canPersonaUseTool(personaForRole(role), tool);
}

/** Clientes nunca veem ferramentas administrativas. */
export function assertNoAdminLeak(persona: AssistantPersona, toolName: BusinessToolName): void {
  if (persona === "CLIENT" || persona === "PARTNER" || persona === "ONG") {
    if (toolName.includes("admin" as never)) {
      throw new Error("ADMIN_TOOL_FORBIDDEN");
    }
  }
}

export function filterToolsForRole<T extends BusinessToolDefinition>(
  tools: T[],
  role: UserRole
): T[] {
  return tools.filter((t) => canRoleUseTool(role, t));
}
