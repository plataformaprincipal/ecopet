import { UserRole, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const extrasSchema = z.object({
  profileImageUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
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
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ONG) {
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
  const profile = await prisma.ongProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return apiFailure("NOT_FOUND", "Perfil de ONG não encontrado.", 404);
  }

  const existingPhotos =
    profile.photos && typeof profile.photos === "object" && !Array.isArray(profile.photos)
      ? (profile.photos as Record<string, unknown>)
      : {};

  const existingDocs = Array.isArray(profile.documents) ? (profile.documents as unknown[]) : [];

  const photos = {
    ...existingPhotos,
    ...(data.profileImageUrl ? { profileImageUrl: data.profileImageUrl } : {}),
    ...(data.coverImageUrl ? { coverImageUrl: data.coverImageUrl } : {}),
    ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
  };

  const profileUpdate = {
    photos: photos as Prisma.InputJsonValue,
    ...(data.verificationDocuments?.length
      ? { documents: [...existingDocs, ...data.verificationDocuments] as Prisma.InputJsonValue }
      : {}),
  } as Prisma.OngProfileUpdateInput;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.profileImageUrl || data.logoUrl
          ? { avatarUrl: data.profileImageUrl ?? data.logoUrl }
          : {}),
      },
    }),
    prisma.ongProfile.update({
      where: { userId: user.id },
      data: profileUpdate,
    }),
  ]);

  return apiSuccess({ message: "Materiais de cadastro salvos." });
}
