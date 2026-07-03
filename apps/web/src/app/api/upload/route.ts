import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { executeUpload } from "@/lib/upload/service";
import { isUploadPurpose, type UploadPurpose } from "@/lib/storage/upload-constraints";
import { IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { INTEGRATION_ERROR_CODES } from "@/lib/integrations/errors";

/**
 * Rota de upload via servidor.
 * Em produção o caminho padrão é o upload DIRETO ao Cloudinary
 * (/api/uploads/cloudinary/signature). Esta rota permanece como fallback
 * de desenvolvimento (ex.: filesystem local) e para chamadas não-navegador.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiFailure("VALIDATION", "Requisição multipart inválida.", 400);
  }

  const purpose = formData.get("purpose") as string | null;
  const file = formData.get("file");

  if (!isUploadPurpose(purpose)) {
    return apiFailure("VALIDATION", "Campo purpose inválido.", 400);
  }
  if (!(file instanceof File)) {
    return apiFailure("VALIDATION", "Arquivo não enviado.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  try {
    const result = await executeUpload({
      purpose: purpose as UploadPurpose,
      buffer,
      mimeType,
      fileName: file.name || "upload",
      ownerId: user!.id,
    });
    return apiSuccess({ upload: { ...result, provider: result.provider } }, 201);
  } catch (e) {
    if (e instanceof IntegrationNotConfiguredError) {
      return apiFailure(
        e.code,
        e.message,
        e.code === INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED ? 503 : 400
      );
    }
    const message = e instanceof Error ? e.message : "Falha no upload.";
    return apiFailure(INTEGRATION_ERROR_CODES.UPLOAD_FAILED, message, 400);
  }
}
