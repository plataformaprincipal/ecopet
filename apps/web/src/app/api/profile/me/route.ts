import { NextResponse } from "next/server";
import { UserRole, AccountStatus, VerificationStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getProfileByUserId, serializeProfile } from "@/lib/profile";
import { optionalSanitizeText, sanitizeText } from "@/lib/sanitize";
import { getProfileUpdateSchema } from "@/schemas/profile";
import { syncAddressRecord } from "@/lib/address-sync";
import { writeAuditLog } from "@/lib/audit-log";
import { USER_ALREADY_REGISTERED_MESSAGE } from "@/lib/registration/document-messages";

function stripProtectedFields(body: Record<string, unknown>) {
  const { role, email, verificationStatus, password, passwordHash, ...rest } = body;
  return rest;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401);
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return apiFailure("NOT_FOUND", "Perfil não encontrado.", 404);
  }

  return apiSuccess({ profile: serializeProfile(profile) });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401);
    }

    if (user.role === UserRole.ADMIN) {
      return apiFailure("FORBIDDEN", "Perfil administrativo não é editável por esta rota.", 403);
    }

    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "REJECTED") {
      return apiFailure("ACCOUNT_UNAVAILABLE", "Sua conta está indisponível para edição.", 403);
    }

    const rawBody = await request.json();
    const body = stripProtectedFields(
      typeof rawBody === "object" && rawBody !== null ? rawBody : {}
    );

    const schema = getProfileUpdateSchema(user.role);
    if (!schema) {
      return apiFailure("FORBIDDEN", "Perfil não editável.", 403);
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const data = parsed.data;

    if (user.role === UserRole.CLIENT) {
      const clientData = data as import("@/schemas/profile").ClientProfileUpdate;

      if (clientData.cpf) {
        const cpfExists = await prisma.user.findFirst({
          where: { cpf: clientData.cpf, id: { not: user.id } },
        });
        if (cpfExists) {
          return apiFailure("CPF_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: sanitizeText(clientData.name),
            phone: clientData.phone,
            birthDate: new Date(clientData.birthDate),
            address: sanitizeText(clientData.address),
            city: sanitizeText(clientData.city),
            state: clientData.state,
            zipCode: clientData.zipCode,
            avatarUrl: clientData.avatarUrl,
            ...(clientData.cpf && !user.cpf ? { cpf: clientData.cpf } : {}),
          },
        });
      });

      await syncAddressRecord(user.id, {
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zipCode: clientData.zipCode,
      });

      const profile = await getProfileByUserId(user.id);
      return apiSuccess({
        message: "Perfil atualizado com sucesso.",
        profile: profile ? serializeProfile(profile) : null,
      });
    }

    if (user.role === UserRole.PARTNER) {
      if (!user.partnerProfile) {
        return apiFailure("NOT_FOUND", "Perfil de parceiro não encontrado.", 404);
      }

      const partnerData = data as import("@/schemas/profile").PartnerProfileUpdate;
      const [partnerCnpj, ongCnpj, userCnpj] = await Promise.all([
        prisma.partnerProfile.findFirst({
          where: { cnpj: partnerData.cnpj, userId: { not: user.id } },
        }),
        prisma.ongProfile.findFirst({
          where: { cnpj: partnerData.cnpj },
        }),
        prisma.user.findFirst({
          where: { cnpj: partnerData.cnpj, id: { not: user.id } },
        }),
      ]);
      if (partnerCnpj || ongCnpj || userCnpj) {
        return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }

      const criticalChange =
        user.accountStatus === AccountStatus.ACTIVE &&
        (partnerData.cnpj !== user.partnerProfile.cnpj ||
          partnerData.legalName !== user.partnerProfile.legalName);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            name: sanitizeText(partnerData.responsibleName),
            phone: partnerData.phone,
            cnpj: partnerData.cnpj,
            avatarUrl: partnerData.avatarUrl,
            ...(criticalChange
              ? { accountStatus: AccountStatus.PENDING, accountStatusReason: null }
              : {}),
          },
        }),
        prisma.partnerProfile.update({
          where: { userId: user.id },
          data: {
            businessName: sanitizeText(partnerData.businessName),
            legalName: sanitizeText(partnerData.legalName),
            cnpj: partnerData.cnpj,
            category: sanitizeText(partnerData.category),
            commercialEmail: partnerData.commercialEmail,
            responsibleName: sanitizeText(partnerData.responsibleName),
            address: sanitizeText(partnerData.address),
            city: sanitizeText(partnerData.city),
            state: partnerData.state,
            zipCode: partnerData.zipCode,
            description: optionalSanitizeText(partnerData.description),
            businessHours: optionalSanitizeText(partnerData.businessHours),
            ...(criticalChange ? { verificationStatus: VerificationStatus.PENDING } : {}),
          },
        }),
      ]);

      if (criticalChange) {
        await writeAuditLog({
          actorId: user.id,
          action: "UPDATE",
          module: "profile.partner",
          resource: "User",
          resourceId: user.id,
          observation: "Alteração crítica (CNPJ/razão social) — conta voltou para PENDING",
        });
      }

      const profile = await getProfileByUserId(user.id);
      return apiSuccess({
        message: criticalChange
          ? "Perfil atualizado. Alterações críticas exigem nova aprovação administrativa."
          : "Perfil atualizado com sucesso.",
        profile: profile ? serializeProfile(profile) : null,
        requiresReapproval: criticalChange,
      });
    }

    if (!user.ongProfile) {
      return apiFailure("NOT_FOUND", "Perfil de ONG não encontrado.", 404);
    }

    const ongData = data as import("@/schemas/profile").OngProfileUpdate;
    const [partnerCnpj, ongCnpj, userCnpj] = await Promise.all([
      prisma.partnerProfile.findFirst({ where: { cnpj: ongData.cnpj } }),
      prisma.ongProfile.findFirst({
        where: { cnpj: ongData.cnpj, userId: { not: user.id } },
      }),
      prisma.user.findFirst({
        where: { cnpj: ongData.cnpj, id: { not: user.id } },
      }),
    ]);
    if (partnerCnpj || ongCnpj || userCnpj) {
      return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
    }

    const criticalChange =
      user.accountStatus === AccountStatus.ACTIVE &&
      (ongData.cnpj !== user.ongProfile.cnpj || ongData.ongName !== user.ongProfile.ongName);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: sanitizeText(ongData.responsibleName),
          phone: ongData.phone,
          cnpj: ongData.cnpj,
          ...(criticalChange
            ? { accountStatus: AccountStatus.PENDING, accountStatusReason: null }
            : {}),
        },
      }),
      prisma.ongProfile.update({
        where: { userId: user.id },
        data: {
          ongName: sanitizeText(ongData.ongName),
          name: sanitizeText(ongData.ongName),
          cnpj: ongData.cnpj,
          responsibleName: sanitizeText(ongData.responsibleName),
          institutionalEmail: ongData.institutionalEmail,
          address: sanitizeText(ongData.address),
          city: sanitizeText(ongData.city),
          state: ongData.state,
          zipCode: ongData.zipCode,
          description: optionalSanitizeText(ongData.description),
          focusArea: optionalSanitizeText(ongData.focusArea),
          ...(criticalChange ? { verificationStatus: VerificationStatus.PENDING } : {}),
        },
      }),
    ]);

    if (criticalChange) {
      await writeAuditLog({
        actorId: user.id,
        action: "UPDATE",
        module: "profile.ong",
        resource: "User",
        resourceId: user.id,
        observation: "Alteração crítica (CNPJ/nome institucional) — conta voltou para PENDING",
      });
    }

    const profile = await getProfileByUserId(user.id);
    return apiSuccess({
      message: criticalChange
        ? "Perfil atualizado. Alterações críticas exigem nova aprovação administrativa."
        : "Perfil atualizado com sucesso.",
      profile: profile ? serializeProfile(profile) : null,
      requiresReapproval: criticalChange,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[profile:put:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível atualizar o perfil.", 500);
  }
}
