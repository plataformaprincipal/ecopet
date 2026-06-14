import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiValidationError, apiConflict } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getProfileByUserId, serializeProfile } from "@/lib/profile";
import { optionalSanitizeText, sanitizeText } from "@/lib/sanitize";
import { getProfileUpdateSchema } from "@/lib/validations/profile";

function conflict(messageKey: string) {
  return apiConflict(messageKey);
}

function stripProtectedFields(body: Record<string, unknown>) {
  const { role, email, verificationStatus, password, passwordHash, cpf, ...rest } = body;
  return rest;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", 401);
  }

  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    return apiError("NOT_FOUND", 404);
  }

  return NextResponse.json({ profile: serializeProfile(profile) });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", 401);
    }

    if (user.role === UserRole.ADMIN) {
      return apiError("FORBIDDEN", 403);
    }

    const rawBody = await request.json();
    const body = stripProtectedFields(
      typeof rawBody === "object" && rawBody !== null ? rawBody : {}
    );

    const schema = getProfileUpdateSchema(user.role);
    if (!schema) {
      return NextResponse.json({ error: "Perfil não editável.", code: "FORBIDDEN" }, { status: 403 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (user.role === UserRole.CLIENT) {
      const clientData = data as import("@/lib/validations/profile").ClientProfileUpdate;

      const updated = await prisma.user.update({
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
        },
        select: { id: true },
      });

      const profile = await getProfileByUserId(updated.id);
      return NextResponse.json({
        message: "Perfil atualizado com sucesso.",
        profile: profile ? serializeProfile(profile) : null,
      });
    }

    if (user.role === UserRole.PARTNER) {
      if (!user.partnerProfile) {
        return NextResponse.json({ error: "Perfil de parceiro não encontrado.", code: "NOT_FOUND" }, { status: 404 });
      }

      const partnerData = data as import("@/lib/validations/profile").PartnerProfileUpdate;
      const cnpjExists = await prisma.partnerProfile.findFirst({
        where: { cnpj: partnerData.cnpj, userId: { not: user.id } },
      });
      if (cnpjExists) {
        return conflict("errors.conflict");
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            name: sanitizeText(partnerData.responsibleName),
            phone: partnerData.phone,
            cnpj: partnerData.cnpj,
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
          },
        }),
      ]);

      const profile = await getProfileByUserId(user.id);
      return NextResponse.json({
        message: "Perfil atualizado com sucesso.",
        profile: profile ? serializeProfile(profile) : null,
      });
    }

    if (!user.ongProfile) {
      return NextResponse.json({ error: "Perfil de ONG não encontrado.", code: "NOT_FOUND" }, { status: 404 });
    }

    const ongData = data as import("@/lib/validations/profile").OngProfileUpdate;
    const cnpjExists = await prisma.ongProfile.findFirst({
      where: { cnpj: ongData.cnpj, userId: { not: user.id } },
    });
    if (cnpjExists) {
      return conflict("errors.conflict");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: sanitizeText(ongData.responsibleName),
          phone: ongData.phone,
          cnpj: ongData.cnpj,
        },
      }),
      prisma.ongProfile.update({
        where: { userId: user.id },
        data: {
          ongName: sanitizeText(ongData.ongName),
          cnpj: ongData.cnpj,
          responsibleName: sanitizeText(ongData.responsibleName),
          institutionalEmail: ongData.institutionalEmail,
          address: sanitizeText(ongData.address),
          city: sanitizeText(ongData.city),
          state: ongData.state,
          zipCode: ongData.zipCode,
          description: optionalSanitizeText(ongData.description),
          focusArea: optionalSanitizeText(ongData.focusArea),
        },
      }),
    ]);

    const profile = await getProfileByUserId(user.id);
    return NextResponse.json({
      message: "Perfil atualizado com sucesso.",
      profile: profile ? serializeProfile(profile) : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[profile:put:error]", error);
    }
    return NextResponse.json(
      { error: "Não foi possível atualizar o perfil.", code: "UNEXPECTED" },
      { status: 500 }
    );
  }
}
