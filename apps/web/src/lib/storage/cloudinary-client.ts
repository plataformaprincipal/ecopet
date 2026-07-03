"use client";

import {
  validateUploadCandidate,
  type UploadPurpose,
} from "@/lib/storage/upload-constraints";

export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super("CLOUDINARY_NOT_CONFIGURED");
    this.name = "CloudinaryNotConfiguredError";
  }
}

export type DirectUploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes: number;
  originalFilename?: string;
  mimeType: string;
  sizeBytes: number;
  provider: "cloudinary";
};

type SignaturePayload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

async function requestSignature(purpose: UploadPurpose): Promise<SignaturePayload> {
  const res = await fetch("/api/uploads/cloudinary/signature", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 503 || data?.error?.code === "UPLOAD_NOT_CONFIGURED") {
    throw new CloudinaryNotConfiguredError();
  }
  if (!res.ok || !data?.success) {
    throw new Error(data?.error?.message ?? "Falha ao obter assinatura de upload.");
  }
  return data.data as SignaturePayload;
}

function uploadXhr(
  file: File,
  sig: SignaturePayload,
  onProgress?: (percent: number) => void
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    const xhr = new XMLHttpRequest();
    // resource_type "auto" deixa o Cloudinary decidir imagem x raw (PDF).
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new Error(json?.error?.message ?? "Falha no upload ao Cloudinary."));
      } catch {
        reject(new Error("Resposta inválida do Cloudinary."));
      }
    };
    xhr.onerror = () => reject(new Error("Erro de rede ao enviar ao Cloudinary."));
    xhr.onabort = () => reject(new Error("Upload cancelado."));

    xhr.send(form);
  });
}

async function persistMetadata(
  purpose: UploadPurpose,
  result: DirectUploadResult,
  folder: string
): Promise<void> {
  try {
    await fetch("/api/uploads/cloudinary/confirm", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose,
        secureUrl: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        originalFilename: result.originalFilename,
        folder,
      }),
    });
  } catch {
    // best-effort: a referência principal (secure_url) já volta para quem chamou.
  }
}

/**
 * Upload direto navegador → Cloudinary, usando assinatura do backend.
 * Lança CloudinaryNotConfiguredError quando o provedor não está configurado
 * (permite fallback para a rota /api/upload apenas em desenvolvimento).
 */
export async function uploadToCloudinarySigned(
  file: File,
  purpose: UploadPurpose,
  opts?: { onProgress?: (percent: number) => void }
): Promise<DirectUploadResult> {
  const mimeType = file.type || "application/octet-stream";
  const check = validateUploadCandidate({
    purpose,
    mimeType,
    sizeBytes: file.size,
    fileName: file.name,
  });
  if (!check.ok) throw new Error(check.message);

  const sig = await requestSignature(purpose);
  const raw = await uploadXhr(file, sig, opts?.onProgress);

  const result: DirectUploadResult = {
    url: String(raw.secure_url ?? ""),
    publicId: String(raw.public_id ?? ""),
    resourceType: String(raw.resource_type ?? "image"),
    format: typeof raw.format === "string" ? raw.format : undefined,
    bytes: typeof raw.bytes === "number" ? raw.bytes : file.size,
    originalFilename:
      typeof raw.original_filename === "string" ? raw.original_filename : file.name,
    mimeType,
    sizeBytes: typeof raw.bytes === "number" ? raw.bytes : file.size,
    provider: "cloudinary",
  };

  if (!result.url) throw new Error("Cloudinary não retornou a URL segura.");

  await persistMetadata(purpose, result, sig.folder);
  return result;
}
