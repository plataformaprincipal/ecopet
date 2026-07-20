import "server-only";

import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import type {
  BusinessToolName,
  ToolExecutionContext,
  ToolExecutionResult,
} from "./types";
import { getBusinessTool } from "./tool-registry";
import { canRoleUseTool, assertNoAdminLeak } from "./permission-checker";
import { validateToolParams, sanitizeToolResult } from "./tool-validator";
import {
  readPublicProducts,
  readPublicServices,
  readPublicPartners,
  readUserCart,
  readUserOrders,
  readOrderById,
  readPetOverview,
  readUserAgenda,
  readSafeProfile,
  readNotifications,
  readPartnerSummary,
  readNgoSummary,
  readSocialSearch,
} from "./services/domain-reads";

async function runHandler(
  name: BusinessToolName,
  ctx: ToolExecutionContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const query = typeof params.query === "string" ? params.query : "";

  switch (name) {
    case "consult_products":
      return readPublicProducts(query);
    case "consult_services":
      return readPublicServices(query);
    case "consult_partners_public":
      return readPublicPartners(query);
    case "consult_cart":
      return readUserCart(ctx.userId);
    case "consult_orders": {
      const orderId = typeof params.orderId === "string" ? params.orderId : "";
      if (orderId) return readOrderById(ctx.userId, orderId);
      return readUserOrders(ctx.userId);
    }
    case "consult_pets":
      return readPetOverview(ctx.userId);
    case "consult_agenda":
      return readUserAgenda(ctx.userId);
    case "consult_profile":
      return readSafeProfile(ctx.userId);
    case "consult_notifications":
      return readNotifications(ctx.userId);
    case "consult_partner_summary":
      return readPartnerSummary(ctx.userId);
    case "consult_ngo_summary":
      return readNgoSummary(ctx.userId);
    case "consult_social":
      return readSocialSearch(ctx.userId, query);
    default:
      return null;
  }
}

/**
 * Executor de ferramentas de negócio.
 * Sem acesso Prisma direto — só services/adaptadores.
 * Preparado para loop de Function Calling futuro.
 */
export async function executeBusinessTool(
  toolName: string,
  ctx: ToolExecutionContext,
  rawParams: Record<string, unknown> = {}
): Promise<ToolExecutionResult> {
  const started = Date.now();
  const tool = getBusinessTool(toolName);
  if (!tool) {
    return {
      toolName: toolName as BusinessToolName,
      executed: false,
      ok: false,
      error: "TOOL_NOT_FOUND",
      data: null,
      latencyMs: Date.now() - started,
    };
  }

  try {
    assertNoAdminLeak(ctx.persona, tool.name);
    if (!canRoleUseTool(ctx.role, tool)) {
      await writeAiAuditLog({
        userId: ctx.userId,
        role: ctx.role,
        module: "ecopet-ai",
        action: `tool:${tool.name}`,
        decision: "DENY",
      }).catch(() => undefined);
      return {
        toolName: tool.name,
        executed: false,
        ok: false,
        error: "PERMISSION_DENIED",
        data: null,
        latencyMs: Date.now() - started,
      };
    }

    const validated = validateToolParams(tool, rawParams);
    if (!validated.ok) {
      return {
        toolName: tool.name,
        executed: false,
        ok: false,
        error: validated.error,
        data: null,
        latencyMs: Date.now() - started,
      };
    }

    const raw = await runHandler(tool.name, ctx, validated.params);
    const data = sanitizeToolResult(raw);

    await writeAiAuditLog({
      userId: ctx.userId,
      role: ctx.role,
      module: "ecopet-ai",
      action: `tool:${tool.name}`,
      decision: "ALLOW",
      metadata: { keys: Object.keys(validated.params) },
    }).catch(() => undefined);

    return {
      toolName: tool.name,
      executed: true,
      ok: true,
      data,
      latencyMs: Date.now() - started,
    };
  } catch (e) {
    return {
      toolName: tool.name,
      executed: false,
      ok: false,
      error: e instanceof Error ? e.message.slice(0, 160) : "TOOL_ERROR",
      data: null,
      latencyMs: Date.now() - started,
    };
  }
}

export async function executeBusinessTools(
  calls: Array<{ name: string; params?: Record<string, unknown> }>,
  ctx: ToolExecutionContext
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = [];
  for (const call of calls.slice(0, 3)) {
    results.push(await executeBusinessTool(call.name, ctx, call.params ?? {}));
  }
  return results;
}
