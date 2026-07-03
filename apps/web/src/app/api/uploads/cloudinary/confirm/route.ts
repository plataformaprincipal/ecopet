import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { isUploadPurpose } from "@/lib/storage/upload-constraints";

/**
 * Persiste os metadados de um upload já enviado ao Cloudinary.
 * Recebe apenas JSON pequeno (sem o arquivo) — seguro para função da Vercel.
 *
 * A escrita é best-effort: se a tabela UploadAsset ainda não foi aplicada no
 * banco (db push pendente), o fluxo de upload não quebra.
 */
function isCloudinaryUrl(url: unknown): url is string {
  return (
    typeof url === "string" &&
    /^https:\/\/res\.cloudinary\.com\//.test(url)
  );
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  if (!checkRateLimit(`upload-confirm:${user!.id}`, 120, 60_000)) {
    return apiFailure("RATE_LIMITED", "Muitas confirmações em sequência. Aguarde um momento.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "Corpo da requisição inválido.", 400);
  }

  if (!isUploadPurpose(body.purpose)) {
    return apiFailure("VALIDATION", "Campo purpose inválido.", 400);
  }
  if (!isCloudinaryUrl(body.secureUrl)) {
    return apiFailure("VALIDATION", "secure_url inválida.", 400);
  }

  const data = {
    ownerId: user!.id,
    purpose: body.purpose,
    provider: "cloudinary",
    secureUrl: body.secureUrl,
    publicId: typeof body.publicId === "string" ? body.publicId : null,
    resourceType: typeof body.resourceType === "string" ? body.resourceType : null,
    format: typeof body.format === "string" ? body.format : null,
    bytes: typeof body.bytes === "number" ? Math.round(body.bytes) : null,
    originalFilename:
      typeof body.originalFilename === "string" ? body.originalFilename.slice(0, 255) : null,
    folder: typeof body.folder === "string" ? body.folder : null,
  };

  try {
    const asset = await prisma.uploadAsset.create({ data });
    return apiSuccess({ asset: { id: asset.id, secureUrl: asset.secureUrl } }, 201);
  } catch {
    // Não bloquear o upload se a persistência de metadados falhar.
    return apiSuccess({ asset: null, persisted: false }, 200);
  }
}
