import { NextResponse } from "next/server";
import { checkDistributedRateLimit, clientIpForRateLimit } from "@/lib/rate-limit";
import { apiFailure } from "@/lib/api-response";
import { AiCommerceError } from "@/lib/ai-commerce/errors";

export async function enforceAiCommerceRateLimit(key: string, limit: number, windowMs = 60_000) {
  const ok = await checkDistributedRateLimit(key, limit, windowMs);
  if (!ok) return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde um momento.", 429);
  return null;
}

export async function enforceAiCommerceEndpointLimits(params: {
  request: Request;
  userId: string;
  endpoint: "upload" | "analyze" | "report";
  extraKey?: string;
}) {
  const ip = clientIpForRateLimit(params.request);
  const limits = { upload: 20, analyze: 10, report: 20 } as const;
  const userLimited = await enforceAiCommerceRateLimit(
    `ai-${params.endpoint}:${params.userId}`,
    limits[params.endpoint]
  );
  if (userLimited) return userLimited;
  const ipLimited = await enforceAiCommerceRateLimit(
    `ai-${params.endpoint}-ip:${ip}`,
    limits[params.endpoint] * 3
  );
  if (ipLimited) return ipLimited;
  if (params.extraKey) {
    const extra = await enforceAiCommerceRateLimit(`ai-${params.endpoint}-ent:${params.extraKey}`, 6);
    if (extra) return extra;
  }
  return null;
}

export function handleAiCommerceError(e: unknown) {
  if (e instanceof AiCommerceError) {
    return apiFailure(e.code, e.message, e.status);
  }
  const msg = e instanceof Error ? e.message : "";
  if (msg === "AI_COMMERCE_DISABLED") {
    return apiFailure("AI_COMMERCE_DISABLED", "As ferramentas EccoPet AI ainda não estão à venda neste ambiente.", 403);
  }
  if (msg === "CHECKOUT_DISABLED") {
    return apiFailure("CHECKOUT_DISABLED", "Checkout temporariamente indisponível.", 503);
  }
  return apiFailure("INTERNAL", "Não foi possível concluir esta ação agora.", 500);
}

export function jsonNoStore(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}
