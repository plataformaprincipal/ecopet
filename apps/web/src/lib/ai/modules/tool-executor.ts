import "server-only";

import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import type {
  BusinessToolName,
  ToolExecutionContext,
  ToolExecutionResult,
} from "./types";
import { getBusinessTool } from "./tool-registry";
import { canRoleUseTool, assertNoAdminLeak } from "./permission-checker";
import { validateToolParams, sanitizeToolResult, stripSensitiveParams } from "./tool-validator";
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
  readAdoptions,
  readLoyalty,
  readTrending,
  readPetVaccinations,
} from "./services/domain-reads";
import {
  writeAddToCart,
  writeSupportTicket,
  writePrepareAppointment,
  writeClientAction,
} from "./services/domain-writes";

function resolveGeoOpts(
  ctx: ToolExecutionContext,
  params: Record<string, unknown>
): { lat?: number; lng?: number; radiusKm?: number } | undefined {
  const lat = typeof params.lat === "number" ? params.lat : ctx.lat;
  const lng = typeof params.lng === "number" ? params.lng : ctx.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { lat, lng, radiusKm: 50 };
}

const CONFIRM_REQUIRED_TOOLS = new Set<BusinessToolName>([
  "add_to_cart",
  "create_support_ticket",
  "prepare_appointment",
]);

async function runHandler(
  name: BusinessToolName,
  ctx: ToolExecutionContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const query = typeof params.query === "string" ? params.query : "";
  const geoOpts = resolveGeoOpts(ctx, params);

  switch (name) {
    case "consult_products":
      return readPublicProducts(query, geoOpts);
    case "consult_services":
      return readPublicServices(query, geoOpts);
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
    case "consult_adoptions":
      return readAdoptions({
        query: typeof params.query === "string" ? params.query : undefined,
        species: typeof params.species === "string" ? params.species : undefined,
        city: typeof params.city === "string" ? params.city : undefined,
        state: typeof params.state === "string" ? params.state : undefined,
        sex: typeof params.sex === "string" ? params.sex : undefined,
        size: typeof params.size === "string" ? params.size : undefined,
        age: typeof params.age === "string" ? params.age : undefined,
      });
    case "consult_loyalty":
      return readLoyalty(ctx.userId);
    case "consult_trending":
      return readTrending();
    case "consult_pet_vaccinations":
      return readPetVaccinations(ctx.userId, {
        petId: typeof params.petId === "string" ? params.petId : undefined,
        petName: typeof params.petName === "string" ? params.petName : undefined,
      });
    case "request_client_action":
      return writeClientAction(params);
    case "add_to_cart":
      return writeAddToCart({
        userId: ctx.userId,
        params,
        confirmed: ctx.confirmed,
      });
    case "create_support_ticket":
      return writeSupportTicket({
        userId: ctx.userId,
        params,
        confirmed: ctx.confirmed,
      });
    case "prepare_appointment":
      return writePrepareAppointment({
        userId: ctx.userId,
        params,
        confirmed: ctx.confirmed,
      });
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

    if (CONFIRM_REQUIRED_TOOLS.has(tool.name) && !ctx.confirmed) {
      const preview = await runHandler(tool.name, { ...ctx, confirmed: false }, validated.params);
      await writeAiAuditLog({
        userId: ctx.userId,
        role: ctx.role,
        module: "ecopet-ai",
        action: `tool:${tool.name}`,
        decision: "CONFIRM_REQUIRED",
        metadata: { keys: Object.keys(validated.params) },
      }).catch(() => undefined);
      return {
        toolName: tool.name,
        executed: false,
        ok: true,
        requiresConfirmation: true,
        params: stripSensitiveParams(validated.params),
        data: sanitizeToolResult(preview),
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
