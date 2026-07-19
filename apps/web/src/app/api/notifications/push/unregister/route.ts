import { z } from "zod";
import { apiFailure, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { unregisterPushDevice } from "@/lib/firebase/token-management";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    deviceId: z.string().min(4).max(120).optional(),
    token: z.string().min(20).max(4096).optional(),
  })
  .refine((v) => Boolean(v.deviceId || v.token), {
    message: "deviceId ou token é obrigatório",
  });

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`fcm-unregister:${user!.id}`, 30, 60_000)) {
    return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiValidationError("Body JSON inválido.");
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiValidationError("Informe deviceId ou token do dispositivo atual.");
  }

  const result = await unregisterPushDevice({
    userId: user!.id,
    deviceId: parsed.data.deviceId,
    token: parsed.data.token,
  });

  return apiSuccess({ deactivated: result.deactivated > 0, count: result.deactivated });
}
