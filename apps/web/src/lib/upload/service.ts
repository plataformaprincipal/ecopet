import { uploadBuffer, validateUploadFile, type UploadPurpose } from "@/lib/upload/cloudinary";
import { isDevUploadFallbackEnabled, saveLocalDevUpload } from "@/lib/upload/local-dev";
import {
  isCloudinaryConfigured as isCloudinaryConfiguredEnv,
  isProduction,
  isSupabaseStorageConfigured,
} from "@/lib/integrations/env-check";
import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { writeIntegrationLog } from "@/lib/integrations/log";

export type UploadInput = {
  purpose: UploadPurpose;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  ownerId: string;
};

export type UploadResult = {
  url: string;
  publicId: string;
  sizeBytes: number;
  mimeType: string;
  provider: "cloudinary" | "supabase" | "local_dev";
};

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_");
  return base.slice(0, 120) || "upload";
}

export function resolveUploadProvider(env = process.env): "cloudinary" | "supabase" | "local_dev" | null {
  if (isCloudinaryConfiguredEnv(env)) return "cloudinary";
  if (isSupabaseStorageConfigured(env)) return "supabase";
  if (isDevUploadFallbackEnabled(env)) return "local_dev";
  return null;
}

export async function executeUpload(input: UploadInput): Promise<UploadResult> {
  const check = validateUploadFile(input.purpose, input.mimeType, input.buffer.length);
  if (!check.ok) throw new Error(check.message);

  const safeName = sanitizeFileName(input.fileName);
  const provider = resolveUploadProvider();

  if (!provider) {
    await writeIntegrationLog({
      integrationName: "upload",
      provider: "none",
      action: "upload",
      status: "FAILED",
      errorCode: INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED,
      message: "Nenhum provedor de upload configurado.",
    });
    throw new IntegrationNotConfiguredError(
      INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED,
      "Upload não configurado. Configure Cloudinary ou Supabase Storage."
    );
  }

  if (provider === "local_dev" && isProduction()) {
    await writeIntegrationLog({
      integrationName: "upload_local_dev",
      provider: "Local Dev",
      action: "upload",
      status: "BLOCKED",
      errorCode: INTEGRATION_ERROR_CODES.UPLOAD_DEV_BLOCKED,
      message: "Fallback local bloqueado em produção.",
    });
    throw new IntegrationNotConfiguredError(
      INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED,
      "Upload local não permitido em produção."
    );
  }

  try {
    let result: UploadResult;

    if (provider === "cloudinary") {
      const uploaded = await uploadBuffer({ ...input, fileName: safeName });
      result = { ...uploaded, provider: "cloudinary" };
    } else if (provider === "supabase") {
      throw new IntegrationNotConfiguredError(
        INTEGRATION_ERROR_CODES.UPLOAD_NOT_CONFIGURED,
        "Supabase Storage ainda não implementado."
      );
    } else {
      const uploaded = await saveLocalDevUpload({ ...input, fileName: safeName });
      result = { ...uploaded, provider: "local_dev" };
    }

    await writeIntegrationLog({
      integrationName: provider === "local_dev" ? "upload_local_dev" : provider,
      provider: provider === "local_dev" ? "Local Dev" : provider,
      action: "upload",
      status: "OK",
      metadata: { purpose: input.purpose, sizeBytes: result.sizeBytes, mimeType: input.mimeType },
    });

    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha no upload.";
    await writeIntegrationLog({
      integrationName: "upload",
      provider: provider ?? "none",
      action: "upload",
      status: "FAILED",
      errorCode: e instanceof IntegrationNotConfiguredError ? e.code : INTEGRATION_ERROR_CODES.UPLOAD_FAILED,
      message,
    });
    throw e;
  }
}
