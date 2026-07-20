import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getOperationalAiDiagnostics,
  listRecentAutomationJobs,
  listAutomationRules,
  processAutomationEvent,
  runAutomationRuleById,
} from "@/lib/ai/operational";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error) return error;

  const [diagnostics, jobs] = await Promise.all([
    getOperationalAiDiagnostics(),
    listRecentAutomationJobs(25),
  ]);

  return apiSuccess({
    diagnostics,
    rules: listAutomationRules(),
    recentJobs: jobs,
  });
}

const postSchema = z.object({
  action: z.enum(["run_event", "run_rule"]),
  event: z.string().optional(),
  ruleId: z.string().optional(),
  userId: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  dedupeKey: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  if (parsed.data.action === "run_event") {
    if (!parsed.data.event) {
      return apiFailure("VALIDATION", "event obrigatório", 400);
    }
    const results = await processAutomationEvent({
      event: parsed.data.event as never,
      userId: parsed.data.userId ?? user.id,
      role: user.role,
      title: parsed.data.title,
      message: parsed.data.message,
      dedupeKey: parsed.data.dedupeKey,
    });
    return apiSuccess({ results });
  }

  if (!parsed.data.ruleId) {
    return apiFailure("VALIDATION", "ruleId obrigatório", 400);
  }

  const result = await runAutomationRuleById(parsed.data.ruleId, {
    userId: parsed.data.userId ?? user.id,
    role: user.role,
    title: parsed.data.title,
    message: parsed.data.message,
    dedupeKey: parsed.data.dedupeKey,
  });
  return apiSuccess({ result });
}
