import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { answerExecutiveQuestion } from "@/lib/admin/erp/assistant-service";
import { z } from "zod";

const bodySchema = z.object({ question: z.string().min(3).max(500) });

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = bodySchema.parse(await request.json());
    const data = await answerExecutiveQuestion(body.question);
    return apiSuccess(data);
  } catch (e) {
    return apiFailure("BAD_REQUEST", (e as Error).message, 400);
  }
}
