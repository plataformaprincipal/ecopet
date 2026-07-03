import type { UploadPurpose } from "@/lib/storage/upload-constraints";
import {
  CloudinaryNotConfiguredError,
  uploadToCloudinarySigned,
} from "@/lib/storage/cloudinary-client";

export type UploadResult = {
  url: string;
  publicId: string;
  sizeBytes: number;
  mimeType: string;
  provider?: string;
  resourceType?: string;
  format?: string;
  originalFilename?: string;
};

export type UploadOptions = {
  onProgress?: (percent: number) => void;
};

/** Fallback (apenas dev): envia o arquivo pela função do servidor. */
async function uploadViaServer(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("purpose", purpose);
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message ?? "Falha no upload.");
  }
  return data.data.upload as UploadResult;
}

/**
 * Fluxo padrão de upload:
 *  1) tenta upload direto navegador → Cloudinary (assinado pelo backend);
 *  2) se o Cloudinary não estiver configurado (ex.: dev sem credenciais),
 *     usa a rota de servidor /api/upload (fallback de desenvolvimento).
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  opts?: UploadOptions
): Promise<UploadResult> {
  try {
    const result = await uploadToCloudinarySigned(file, purpose, {
      onProgress: opts?.onProgress,
    });
    return {
      url: result.url,
      publicId: result.publicId,
      sizeBytes: result.sizeBytes,
      mimeType: result.mimeType,
      provider: result.provider,
      resourceType: result.resourceType,
      format: result.format,
      originalFilename: result.originalFilename,
    };
  } catch (e) {
    if (e instanceof CloudinaryNotConfiguredError) {
      return uploadViaServer(file, purpose);
    }
    throw e;
  }
}
