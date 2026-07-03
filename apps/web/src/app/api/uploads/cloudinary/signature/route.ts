import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { INTEGRATION_ERROR_CODES } from "@/lib/integrations/errors";
import { isUploadPurpose } from "@/lib/storage/upload-constraints";
import { createSignedUpload, isCloudinaryConfigured } from "@/lib/storage/cloudinary";

/**
 * Gera uma assinatura de upload direto para o navegador enviar o arquivo
 * diretamente ao Cloudinary (sem passar o arquivo pela função da Vercel).
 *
 * Retorna apenas: signature, timestamp, apiKey, cloudName, folder.
 * O CLOUDINARY_API_SECRET nunca sai do servidor.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`upload-sig:${user!.id}`, 60, 60_000)) {
    return apiFailure("RATE_LIMITED", "Muitos uploads em sequência. Aguarde um momento.", 429);
  }

  let body: { purpose?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "Corpo da requisição inválido.", 400);
  }

  if (!isUploadPurpose(body.purpose)) {
    return apiFailure("VALIDATION", "Campo purpose inválido.", 400);
  }

  if (!isCloudinaryConfigured()) {
    // 503 sinaliza ao cliente que deve usar o fallback (apenas em desenvolvimento).
    return apiFailure(
      INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED,
      "Upload em nuvem não configurado.",
      503
    );
  }

  try {
    const signed = createSignedUpload({ purpose: body.purpose, ownerId: user!.id });
    return apiSuccess(signed, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao assinar upload.";
    return apiFailure(INTEGRATION_ERROR_CODES.UPLOAD_FAILED, message, 500);
  }
}
