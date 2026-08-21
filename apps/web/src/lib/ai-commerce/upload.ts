import "server-only";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { executeUpload } from "@/lib/upload/service";
import { assertPetOwned } from "./entitlement-service";
import { getOwnedExecution } from "./execution-service";
import { AiCommerceError } from "./errors";
import { AI_COMMERCE_LIMITS } from "./models";

const VISION_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const LAB_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function detectMimeMagic(buf: Buffer, claimed: string): boolean {
  if (claimed === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8;
  if (claimed === "image/png") return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (claimed === "image/webp") return buf.toString("ascii", 0, 4) === "RIFF";
  if (claimed === "application/pdf") return buf.toString("ascii", 0, 5) === "%PDF-";
  return false;
}

export async function storeExecutionAsset(params: {
  userId: string;
  executionId: string;
  petId: string;
  type: "vision" | "lab";
  mimeType: string;
  buffer: Buffer;
  fileName: string;
}) {
  await assertPetOwned(params.userId, params.petId);
  await getOwnedExecution(params.userId, params.executionId);

  const allowed = params.type === "vision" ? VISION_MIME : LAB_MIME;
  if (!allowed.has(params.mimeType)) {
    throw new AiCommerceError("FILE_UNREADABLE", "Não conseguimos ler este arquivo. Envie um PDF ou imagem com boa qualidade.", 400);
  }
  if (params.buffer.length > AI_COMMERCE_LIMITS.maxFileBytes) {
    throw new AiCommerceError("FILE_TOO_LARGE", "Arquivo acima do limite permitido.", 400);
  }
  if (!detectMimeMagic(params.buffer, params.mimeType)) {
    throw new AiCommerceError("FILE_UNREADABLE", "Não conseguimos ler este arquivo. Envie um PDF ou imagem com boa qualidade.", 400);
  }

  const existing = await prisma.aIUploadedAsset.count({ where: { executionId: params.executionId, status: "READY" } });
  const max = params.type === "vision" ? AI_COMMERCE_LIMITS.maxImages : AI_COMMERCE_LIMITS.maxFiles;
  if (existing >= max) {
    throw new AiCommerceError("FILE_LIMIT", "Limite de arquivos desta utilização atingido.", 400);
  }

  const sha256 = createHash("sha256").update(params.buffer).digest("hex");
  const uploaded = await executeUpload({
    purpose: "ai_attachment",
    buffer: params.buffer,
    mimeType: params.mimeType,
    fileName: `${randomUUID()}.${params.mimeType.split("/")[1] === "jpeg" ? "jpg" : params.mimeType.split("/")[1]}`,
    ownerId: params.userId,
  });

  return prisma.aIUploadedAsset.create({
    data: {
      executionId: params.executionId,
      userId: params.userId,
      petId: params.petId,
      type: params.type,
      mimeType: params.mimeType,
      storageKey: uploaded.url || uploaded.publicId,
      size: params.buffer.length,
      sha256,
      status: "READY",
    },
  });
}
