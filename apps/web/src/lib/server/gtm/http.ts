import "server-only";

import { apiFailure, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/auth/guards";
import { writeAnalyticsAudit } from "@/lib/analytics/server/audit";
import type { NextResponse } from "next/server";

type Handler = (ctx: {
  userId: string;
  request: Request;
}) => Promise<NextResponse> | NextResponse;

/** ADMIN + rate limit + audit opcional para rotas GTM backend. */
export async function withGtmAdminRoute(
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
  const { user, error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return error;

  const limit = opts.limit ?? 30;
  const windowMs = opts.windowMs ?? 60_000;
  if (!checkRateLimit(`gtm-admin:${opts.rateKey}:${user!.id}`, limit, windowMs)) {
    return apiFailure("RATE_LIMIT", "Limite de requisições GTM.", 429);
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
