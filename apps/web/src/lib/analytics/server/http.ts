import "server-only";

import { apiFailure, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAnalyticsAdmin } from "./security";
import { writeAnalyticsAudit } from "./audit";
import type { NextResponse } from "next/server";

type Handler = (ctx: {
  userId: string;
  request: Request;
}) => Promise<NextResponse> | NextResponse;

/** Wrapper HTTP — ADMIN + rate limit + audit VIEW opcional. */
export async function withAnalyticsAdminRoute(
  request: Request,
  opts: {
    rateKey: string;
    limit?: number;
    windowMs?: number;
    auditResource?: string;
    auditAction?: "VIEW" | "UPDATE" | "CREATE" | "DELETE" | "EXPORT";
    auditMeta?: Record<string, unknown>;
  },
  handler: Handler
) {
  const { user, error } = await requireAnalyticsAdmin();
  if (error) return error;

  const limit = opts.limit ?? 30;
  const windowMs = opts.windowMs ?? 60_000;
  if (!checkRateLimit(`analytics-api:${opts.rateKey}:${user!.id}`, limit, windowMs)) {
    return apiFailure("RATE_LIMIT", "Limite de requisições analytics.", 429);
  }

  const response = await handler({ userId: user!.id, request });

  if (opts.auditResource) {
    await writeAnalyticsAudit({
      userId: user!.id,
      action: opts.auditAction ?? "VIEW",
      resource: opts.auditResource,
      metadata: opts.auditMeta,
    });
  }

  return response;
}

export { apiSuccess, apiFailure };
