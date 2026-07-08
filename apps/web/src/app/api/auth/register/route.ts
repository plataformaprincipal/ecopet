import { NextResponse } from "next/server";
import { UserRole, AccountStatus, VerificationStatus, ApprovalStatus, ApprovalType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  sanitizeUser,
  safeUserSelect,
} from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { registerSchema, partnerRegisterSchemaLegacy } from "@/schemas/auth";
import {
  partnerRegisterSchema,
  composePartnerAddressLine,
  composePartnerCategory,
  type PartnerRegisterInput,
} from "@/schemas/partner-register";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";
import { emailRegisterCompleted } from "@/lib/mail/event-dispatch";
import { localeFromAcceptLanguage } from "@/lib/email/templates";
import {
  isCpfGloballyAvailable,
  isCnpjGloballyAvailable,
} from "@/lib/registration/document-availability";
import { USER_ALREADY_REGISTERED_MESSAGE } from "@/lib/registration/document-messages";
import {
  ongRegisterSchema,
  ongLegacyRegisterSchema,
  type OngRegisterInput,
} from "@/schemas/ong-register";

const ALLOWED_REGISTER_ROLES = [UserRole.CLIENT, UserRole.PARTNER, UserRole.ONG] as const;

function formatBusinessHours(data: PartnerRegisterInput): string {
  const op = data.operationDetails;
  const parts = [...op.modes];
  if (op.weekdays?.length) parts.push(`Dias: ${op.weekdays.join(",")}`);
  if (op.openTime && op.closeTime) parts.push(`${op.openTime}-${op.closeTime}`);
  return parts.join(" | ");
}

async function createPartnerUser(data: PartnerRegisterInput) {
  const isAutonomous = data.partnerType === "AUTONOMOUS";
  const businessName = isAutonomous ? data.professionalName.trim() : data.businessName.trim();
  const legalName = isAutonomous ? data.name.trim() : data.legalName.trim();
  const addressLine = composePartnerAddressLine(data.addressDetails);
  const category = composePartnerCategory(data.activityAreas, data.activityAreasOther);
  const passwordHash = await hashPassword(data.password);

  const profileCreate = {
    partnerType: data.partnerType,
    businessName,
    legalName,
    cnpj: isAutonomous ? null : data.cnpj,
    corporateType: isAutonomous ? null : data.corporateType,
    category,
    address: addressLine,
    city: data.addressDetails.city.trim(),
    state: data.addressDetails.state,
    zipCode: data.addressDetails.zipCode.replace(/\D/g, ""),
    description: data.businessDescription.trim(),
    businessHours: formatBusinessHours(data),
    activityStartDate: new Date(`${data.activityStartDate}T12:00:00`),
    activityAreas: data.activityAreas,
    addressDetails: data.addressDetails,
    operationDetails: data.operationDetails,
    financialDetails: data.financialDetails,
    verificationDocuments: data.verificationDocuments ?? undefined,
    cnpjDetails: data.cnpjDetails ?? undefined,
    logoAlt: data.logoAlt ?? undefined,
    responsibleName: data.name.trim(),
    commercialEmail: data.email,
    verificationStatus: VerificationStatus.PENDING,
  } as Prisma.PartnerProfileUncheckedCreateWithoutUserInput;

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        username: data.username,
        passwordHash,
        role: UserRole.PARTNER,
        phone: data.phone,
        cpf: isAutonomous ? data.cpf : null,
        cnpj: isAutonomous ? null : data.cnpj,
        avatarUrl: data.logoUrl ?? undefined,
        accountStatus: AccountStatus.PENDING,
        termsAcceptedAt: new Date(),
        lgpdAcceptedAt: new Date(),
        zipCode: data.addressDetails.zipCode.replace(/\D/g, ""),
        city: data.addressDetails.city.trim(),
        state: data.addressDetails.state,
        address: addressLine,
        partnerProfile: {
          create: profileCreate,
        },
      },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
    await tx.approvalRequest.create({
      data: {
        type: ApprovalType.PARTNER,
        entityType: "User",
        entityId: created.id,
        requesterId: created.id,
        status: ApprovalStatus.PENDING,
      },
    });
    return created;
  });
}

async function createLegacyPartnerUser(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  legalName: string;
  cnpj: string;
  category: string;
  address: string;
  city: string;
  state: string;
  username?: string;
}) {
  const passwordHash = await hashPassword(data.password);
  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        username: data.username ?? null,
        passwordHash,
        role: UserRole.PARTNER,
        phone: data.phone,
        cnpj: data.cnpj,
        accountStatus: AccountStatus.PENDING,
        termsAcceptedAt: new Date(),
        lgpdAcceptedAt: new Date(),
        partnerProfile: {
          create: {
            partnerType: "CORPORATE",
            businessName: data.businessName.trim(),
            legalName: data.legalName.trim(),
            cnpj: data.cnpj,
            category: data.category.trim(),
            address: data.address.trim(),
            city: data.city.trim(),
            state: data.state,
            responsibleName: data.name.trim(),
            commercialEmail: data.email,
            verificationStatus: VerificationStatus.PENDING,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
    await tx.approvalRequest.create({
      data: {
        type: ApprovalType.PARTNER,
        entityType: "User",
        entityId: created.id,
        requesterId: created.id,
        status: ApprovalStatus.PENDING,
      },
    });
    return created;
  });
}

async function createLegacyOngUser(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  ongName: string;
  cnpj: string;
  responsibleName: string;
  address: string;
  city: string;
  state: string;
}) {
  const passwordHash = await hashPassword(data.password);
  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        passwordHash,
        role: UserRole.ONG,
        phone: data.phone,
        cnpj: data.cnpj,
        accountStatus: AccountStatus.PENDING,
        ongProfile: {
          create: {
            ongName: data.ongName.trim(),
            name: data.ongName.trim(),
            responsible: data.responsibleName.trim(),
            responsibleName: data.responsibleName.trim(),
            cnpj: data.cnpj,
            documentType: "CNPJ",
            address: data.address.trim(),
            city: data.city.trim(),
            state: data.state,
            institutionalEmail: data.email,
            verificationStatus: VerificationStatus.PENDING,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
    await tx.approvalRequest.create({
      data: {
        type: ApprovalType.ONG,
        entityType: "User",
        entityId: created.id,
        requesterId: created.id,
        status: ApprovalStatus.PENDING,
      },
    });
    return created;
  });
}

async function createOngUser(data: OngRegisterInput) {
  const passwordHash = await hashPassword(data.password);
  const isIndividual = data.ongType === "INDIVIDUAL";
  const docDigits = isIndividual ? data.cpf : data.cnpj;
  const displayName = isIndividual ? data.name.trim() : data.ongName.trim();

  const profileDetailsPayload = {
    ...(data.profileDetails ?? {}),
    legalName: !isIndividual && "legalName" in data ? data.legalName : undefined,
  };

  const photos = {
    profileImageUrl: data.profileDetails?.profileImageUrl,
    coverImageUrl: data.profileDetails?.coverImageUrl,
    logoUrl: data.profileDetails?.logoUrl,
    ...profileDetailsPayload,
  };

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        username: data.username,
        passwordHash,
        role: UserRole.ONG,
        phone: data.phone,
        cpf: data.cpf,
        cnpj: isIndividual ? null : data.cnpj,
        city: data.city.trim(),
        state: data.state,
        address: data.address?.trim() || null,
        accountStatus: AccountStatus.PENDING,
        termsAcceptedAt: new Date(),
        lgpdAcceptedAt: new Date(),
        ongProfile: {
          create: {
            ongName: displayName,
            name: isIndividual ? data.name.trim() : data.tradeName?.trim() || data.ongName.trim(),
            tradeName: !isIndividual ? data.tradeName?.trim() || null : null,
            documentType: isIndividual ? "CPF" : "CNPJ",
            cnpj: docDigits,
            responsible: data.name.trim(),
            responsibleName: data.name.trim(),
            institutionalEmail: data.email,
            address: data.address?.trim() || null,
            city: data.city.trim(),
            state: data.state,
            description: data.description.trim(),
            focusArea: !isIndividual && "focusArea" in data ? data.focusArea : null,
            actionTypes: data.actionTypes,
            animalCapacity: data.animalCapacity ?? null,
            photos: photos as Prisma.InputJsonValue,
            documents: data.verificationDocuments ?? undefined,
            verificationStatus: VerificationStatus.PENDING,
          } as Prisma.OngProfileUncheckedCreateWithoutUserInput,
        },
      },
      select: { id: true, name: true, email: true, role: true, accountStatus: true },
    });
    await tx.approvalRequest.create({
      data: {
        type: ApprovalType.ONG,
        entityType: "User",
        entityId: created.id,
        requesterId: created.id,
        status: ApprovalStatus.PENDING,
      },
    });
    return created;
  });
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
      return apiFailure("RATE_LIMITED", "Muitas tentativas de cadastro. Tente novamente mais tarde.", 429);
    }

    const body = await request.json();

    let partnerData: PartnerRegisterInput | null = null;
    let legacyPartner = false;
    let ongData: OngRegisterInput | null = null;
    let legacyOng = false;
    let parsedClientOng = registerSchema.safeParse(body);

    if (body?.role === UserRole.PARTNER) {
      parsedClientOng = { success: false, error: {} as never };
      const modern = partnerRegisterSchema.safeParse(body);
      if (modern.success) {
        partnerData = modern.data;
      } else {
        const legacy = partnerRegisterSchemaLegacy.safeParse(body);
        if (legacy.success) {
          legacyPartner = true;
        } else {
          const first =
            modern.error.errors[0] ?? legacy.error.errors[0];
          return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
        }
      }
    }

    if (body?.role === UserRole.ONG) {
      parsedClientOng = { success: false, error: {} as never };
      const modern = ongRegisterSchema.safeParse(body);
      if (modern.success) {
        ongData = modern.data;
      } else {
        const legacy = ongLegacyRegisterSchema.safeParse(body);
        if (legacy.success) {
          legacyOng = true;
        } else {
          const first = modern.error.errors[0] ?? legacy.error.errors[0];
          return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
        }
      }
    }

    if (!partnerData && !legacyPartner && !ongData && !legacyOng && !parsedClientOng.success) {
      const first = parsedClientOng.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const data = parsedClientOng.success ? parsedClientOng.data : null;

    if (data && !ALLOWED_REGISTER_ROLES.includes(data.role as (typeof ALLOWED_REGISTER_ROLES)[number])) {
      return apiFailure("FORBIDDEN", "Tipo de cadastro não permitido nesta página.", 403);
    }

    if (partnerData) {
      if (partnerData.password !== partnerData.confirmPassword) {
        return apiFailure("VALIDATION", PASSWORD_MISMATCH_MESSAGE, 400);
      }
    } else if (ongData) {
      if (ongData.password !== ongData.confirmPassword) {
        return apiFailure("VALIDATION", PASSWORD_MISMATCH_MESSAGE, 400);
      }
    } else if (data && data.password !== data.confirmPassword) {
      return apiFailure("VALIDATION", PASSWORD_MISMATCH_MESSAGE, 400);
    }

    const email =
      partnerData?.email ??
      ongData?.email ??
      (legacyPartner || legacyOng ? body.email : data!.email);
    const phone =
      partnerData?.phone ??
      ongData?.phone ??
      (legacyPartner || legacyOng ? body.phone : data!.phone);

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return apiFailure("EMAIL_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
    }

    const phoneExists = await prisma.user.findFirst({ where: { phone } });
    if (phoneExists) {
      return apiFailure("PHONE_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
    }

    if (partnerData) {
      const usernameExists = await prisma.user.findUnique({ where: { username: partnerData.username } });
      if (usernameExists) {
        return apiFailure("USERNAME_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
      if (partnerData.partnerType === "AUTONOMOUS") {
        const cpfAvailable = await isCpfGloballyAvailable(partnerData.cpf);
        if (!cpfAvailable) {
          return apiFailure("CPF_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
        }
      } else {
        const cnpjAvailable = await isCnpjGloballyAvailable(partnerData.cnpj);
        if (!cnpjAvailable) {
          return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
        }
      }
    }

    if (ongData) {
      const usernameExists = await prisma.user.findUnique({ where: { username: ongData.username } });
      if (usernameExists) {
        return apiFailure("USERNAME_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
      const cpfAvailable = await isCpfGloballyAvailable(ongData.cpf);
      if (!cpfAvailable) {
        return apiFailure("CPF_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
      if (ongData.ongType === "INSTITUTION") {
        const cnpjAvailable = await isCnpjGloballyAvailable(ongData.cnpj);
        if (!cnpjAvailable) {
          return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
        }
      }
    }

    if (legacyPartner) {
      const legacy = partnerRegisterSchemaLegacy.parse(body);
      const pwdCheck = validateStrongPassword(legacy.password, { email: legacy.email, name: legacy.name });
      if (!pwdCheck.valid) {
        return apiFailure("VALIDATION", pwdCheck.error ?? "Senha inválida.", 400);
      }
      const cnpjAvailable = await isCnpjGloballyAvailable(legacy.cnpj);
      if (!cnpjAvailable) {
        return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
      const user = await createLegacyPartnerUser(legacy);
      const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
      const response = apiSuccess(
        { message: "Conta criada com sucesso!", user: fullUser ? sanitizeUser(fullUser) : user, redirectTo: dashboardPathForRole(user.role) },
        201
      );
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      void emailRegisterCompleted(user.email, user.name, user.role, localeFromAcceptLanguage(request.headers.get("accept-language")));
      return response;
    }

    if (partnerData) {
      const user = await createPartnerUser(partnerData);
      const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
      const response = apiSuccess(
        { message: "Cadastro de parceiro recebido. Sua conta está em análise e você será avisado após a aprovação.", user: fullUser ? sanitizeUser(fullUser) : user, redirectTo: dashboardPathForRole(user.role) },
        201
      );
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      void emailRegisterCompleted(user.email, user.name, user.role, localeFromAcceptLanguage(request.headers.get("accept-language")));
      return response;
    }

    if (legacyOng) {
      const legacy = ongLegacyRegisterSchema.parse(body);
      const pwdCheck = validateStrongPassword(legacy.password, { email: legacy.email, name: legacy.name });
      if (!pwdCheck.valid) {
        return apiFailure("VALIDATION", pwdCheck.error ?? "Senha inválida.", 400);
      }
      const cnpjAvailable = await isCnpjGloballyAvailable(legacy.cnpj);
      if (!cnpjAvailable) {
        return apiFailure("CNPJ_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
      const user = await createLegacyOngUser(legacy);
      const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
      const response = apiSuccess(
        { message: "Conta criada com sucesso!", user: fullUser ? sanitizeUser(fullUser) : user, redirectTo: dashboardPathForRole(user.role) },
        201
      );
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      void emailRegisterCompleted(user.email, user.name, user.role, localeFromAcceptLanguage(request.headers.get("accept-language")));
      return response;
    }

    if (ongData) {
      const user = await createOngUser(ongData);
      const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });
      const response = apiSuccess(
        { message: "Cadastro de ONG recebido. Sua conta está em análise e você será avisado após a aprovação.", user: fullUser ? sanitizeUser(fullUser) : user, redirectTo: dashboardPathForRole(user.role) },
        201
      );
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      void emailRegisterCompleted(user.email, user.name, user.role, localeFromAcceptLanguage(request.headers.get("accept-language")));
      return response;
    }

    if (!data) {
      return apiFailure("VALIDATION", "Dados inválidos", 400);
    }

    const pwdContext =
      data.role === UserRole.CLIENT
        ? {
            email: data.email,
            name: data.name,
            username: "username" in data ? data.username : undefined,
            phone: data.phone,
            birthDate: "birthDate" in data ? data.birthDate : undefined,
          }
        : { email: data.email, name: data.name };

    const pwdCheck = validateStrongPassword(data.password, pwdContext);
    if (!pwdCheck.valid) {
      return apiFailure("VALIDATION", pwdCheck.error ?? "Senha não atende aos requisitos de segurança.", 400);
    }

    if (data.role === UserRole.CLIENT) {
      const usernameExists = await prisma.user.findUnique({ where: { username: data.username }, select: { id: true } });
      if (usernameExists) {
        return apiFailure("USERNAME_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
    }

    if (data.role === UserRole.CLIENT && data.cpf) {
      const cpfAvailable = await isCpfGloballyAvailable(data.cpf);
      if (!cpfAvailable) {
        return apiFailure("CPF_DUPLICATE", USER_ALREADY_REGISTERED_MESSAGE, 409);
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      if (data.role === UserRole.CLIENT) {
        const genderValue =
          data.gender === "OUTRO" && data.genderOther?.trim()
            ? `Outro: ${data.genderOther.trim()}`
            : data.gender === "MASCULINO"
              ? "Masculino"
              : data.gender === "FEMININO"
                ? "Feminino"
                : data.gender === "NAO_BINARIO"
                  ? "Não Binário"
                  : data.gender === "NAO_DECLARAR"
                    ? "Prefiro Não Declarar"
                    : "Outro";

        return tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            username: data.username,
            passwordHash,
            role: UserRole.CLIENT,
            phone: data.phone,
            gender: genderValue,
            cpf: data.cpf ?? null,
            birthDate: new Date(data.birthDate),
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            state: data.state ?? null,
            accountStatus: AccountStatus.ACTIVE,
            termsAcceptedAt: new Date(),
            lgpdAcceptedAt: new Date(),
          },
          select: { id: true, name: true, email: true, role: true, accountStatus: true },
        });
      }

      throw new Error("Unsupported role in client-only path");
    });

    const token = await createSessionToken(user.id, user.email, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: safeUserSelect });

    const response = apiSuccess(
      {
        message: "Conta criada com sucesso!",
        user: fullUser ? sanitizeUser(fullUser) : user,
        redirectTo: dashboardPathForRole(user.role),
      },
      201
    );

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    void emailRegisterCompleted(user.email, user.name, user.role, localeFromAcceptLanguage(request.headers.get("accept-language")));
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[register:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível concluir o cadastro. Tente novamente.", 500);
  }
}
