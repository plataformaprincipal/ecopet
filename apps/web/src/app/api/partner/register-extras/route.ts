import { UserRole, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const extrasSchema = z.object({
  logoUrl: z.string().url().optional(),
  logoAlt: z.string().max(200).optional(),
  verificationDocuments: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        typeLabel: z.string(),
        fileName: z.string(),
        url: z.string().url(),
        mimeType: z.string(),
        sizeBytes: z.number(),
        uploadedAt: z.string(),
      })
    )
    .optional(),
  cnpjDetails: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.PARTNER) {
    return apiFailure("UNAUTHORIZED", "Sessão inválida.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiFailure("VALIDATION", "Corpo inválido.", 400);
  }

  const parsed = extrasSchema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  const data = parsed.data;
  const profile = await prisma.partnerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return apiFailure("NOT_FOUND", "Perfil de parceiro não encontrado.", 404);
  }

  const profileRow = profile as typeof profile & {
    verificationDocuments?: unknown;
  };
  const existingDocs = Array.isArray(profileRow.verificationDocuments)
    ? (profileRow.verificationDocuments as unknown[])
    : [];

  const profileUpdate = {
    ...(data.logoAlt ? { logoAlt: data.logoAlt } : {}),
    ...(data.cnpjDetails ? { cnpjDetails: data.cnpjDetails } : {}),
    ...(data.verificationDocuments?.length
      ? { verificationDocuments: [...existingDocs, ...data.verificationDocuments] }
      : {}),
  } as Prisma.PartnerProfileUpdateInput;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.logoUrl ? { avatarUrl: data.logoUrl } : {}),
      },
    }),
    prisma.partnerProfile.update({
      where: { userId: user.id },
      data: profileUpdate,
    }),
  ]);

  return apiSuccess({ message: "Materiais de cadastro salvos." });
}
