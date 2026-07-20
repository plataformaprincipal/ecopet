/**
 * Arquitetura de Function Calling (preparada).
 * Não implementa MCP nem Agents SDK.
 * O stream atual usa intent-router + tool-executor;
 * este módulo expõe schemas/validação para o loop OpenAI futuro.
 */
import type { UserRole } from "@prisma/client";
import { toOpenAiToolSchemas, getBusinessTool } from "./tool-registry";
import { validateToolParams } from "./tool-validator";
import { executeBusinessTool } from "./tool-executor";
import type { ToolExecutionContext } from "./types";
import { personaForRole } from "./permission-checker";

export type FunctionCallRequest = {
  name: string;
  arguments: Record<string, unknown>;
};

export function listFunctionCallingSchemas(role: UserRole) {
  return toOpenAiToolSchemas(role);
}

export function parseFunctionCallArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export async function handleFunctionCall(
  call: FunctionCallRequest,
  ctx: Omit<ToolExecutionContext, "persona"> & { persona?: ToolExecutionContext["persona"] }
) {
  const tool = getBusinessTool(call.name);
  if (!tool) {
    return { ok: false as const, error: "TOOL_NOT_FOUND", data: null };
  }
  const validated = validateToolParams(tool, call.arguments);
  if (!validated.ok) {
    return { ok: false as const, error: validated.error, data: null };
  }
  const result = await executeBusinessTool(call.name, {
    userId: ctx.userId,
    role: ctx.role,
    persona: ctx.persona ?? personaForRole(ctx.role),
    locale: ctx.locale,
    confirmed: ctx.confirmed,
  }, validated.params);
  return result;
}

export const FUNCTION_CALLING_READY = {
  schemas: true,
  validation: true,
  executor: true,
  permissions: true,
  /** Loop operacional via enterprise/tool-loop + Responses API */
  openAiToolLoop: true,
  mcp: false,
} as const;
