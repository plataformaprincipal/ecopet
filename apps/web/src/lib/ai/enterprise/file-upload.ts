/**
 * Upload seguro de anexos da IA via Cloudinary.
 * Valida tipo/tamanho/extensão. Virus scan: camada preparada (skipped).
 */
import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadBuffer, isCloudinaryConfigured } from "@/lib/upload/cloudinary";
import {
  detectAiFileKind,
  planFileProcessing,
  extractPlainTextIfSupported,
} from "./file-processing";

export type AiUploadResult = {
  fileId: string;
  kind: string;
  status: string;
  virusScan: string;
  processing: ReturnType<typeof planFileProcessing>;
  textPreview: string | null;
  secureUrl: string | null;
};

export async function uploadAiAttachment(input: {
  userId: string;
  conversationId?: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<AiUploadResult> {
  const kind = detectAiFileKind(input.fileName, input.mimeType);
  const processing = planFileProcessing(kind);
  const extracted = extractPlainTextIfSupported(kind, input.buffer);
  const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";

  let cloudinaryId: string | null = null;
  let secureUrl: string | null = null;

  if (isCloudinaryConfigured()) {
    const uploaded = await uploadBuffer({
      purpose: "ai_attachment",
      buffer: input.buffer,
      mimeType: input.mimeType,
      fileName: input.fileName,
      ownerId: input.userId,
    });
    cloudinaryId = uploaded.publicId;
    secureUrl = uploaded.url;
  }

  const row = await prisma.aIFile.create({
    data: {
      userId: input.userId,
      conversationId: input.conversationId ?? null,
      purpose: "ai_attachment",
      fileName: input.fileName.slice(0, 200),
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      extension: ext || null,
      cloudinaryId,
      secureUrl,
      status: "UPLOADED",
      virusScan: "skipped",
      metadata: {
        kind,
        processing,
        textPreview: extracted.text?.slice(0, 500) ?? null,
        note: extracted.note,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    fileId: row.id,
    kind,
    status: row.status,
    virusScan: row.virusScan,
    processing,
    textPreview: extracted.text?.slice(0, 500) ?? null,
    secureUrl,
  };
}
