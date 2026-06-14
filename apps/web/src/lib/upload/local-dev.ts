import path from "path";
import { mkdir, writeFile } from "fs/promises";
import type { UploadPurpose } from "@/lib/upload/cloudinary";
import { validateUploadFile } from "@/lib/upload/cloudinary";
import { isProduction } from "@/lib/integrations/env-check";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function isDevUploadFallbackEnabled(env = process.env) {
  if (env.UPLOAD_DEV_FALLBACK === "0") return false;
  if (env.UPLOAD_DEV_FALLBACK === "1") return true;
  return env.NODE_ENV !== "production";
}

function assertSafePathSegment(segment: string): string {
  const safe = segment.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (safe.includes("..") || path.isAbsolute(safe)) {
    throw new Error("Nome de arquivo inválido.");
  }
  return safe;
}

export async function saveLocalDevUpload(params: {
  purpose: UploadPurpose;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  ownerId: string;
}) {
  if (isProduction()) {
    throw new Error("Upload local não permitido em produção.");
  }

  const check = validateUploadFile(params.purpose, params.mimeType, params.buffer.length);
  if (!check.ok) throw new Error(check.message);

  const ext = MIME_EXT[params.mimeType] ?? "bin";
  const safeName = assertSafePathSegment(params.fileName);
  const safeOwner = assertSafePathSegment(params.ownerId);
  const relativeDir = path.posix.join("uploads", "dev", params.purpose, safeOwner);
  const fileId = `${Date.now()}-${safeName}.${ext}`;
  const relativePath = path.posix.join(relativeDir, fileId);

  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  const absoluteFile = path.join(absoluteDir, fileId);

  if (!absoluteFile.startsWith(path.join(process.cwd(), "public"))) {
    throw new Error("Caminho de upload inválido.");
  }

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absoluteFile, params.buffer);

  return {
    url: `/${relativePath.replace(/\\/g, "/")}`,
    publicId: `dev:${relativePath.replace(/\\/g, "/")}`,
    sizeBytes: params.buffer.length,
    mimeType: params.mimeType,
  };
}
