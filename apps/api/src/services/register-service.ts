import bcrypt from "bcryptjs";
import { AccountStatus, UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@ecopet/database";
import {
  type RegisterInput,
  PENDING_APPROVAL_ROLES,
  ROLE_REDIRECTS,
  cpfSchema,
  cnpjSchema,
  tutorRegisterSchema,
  veterinarianRegisterSchema,
  clinicRegisterSchema,
  petshopRegisterSchema,
  sellerRegisterSchema,
  serviceProviderRegisterSchema,
  ongRegisterSchema,
  adminRegisterSchema,
} from "../schemas/register-schemas.js";
import type { z } from "zod";
import { normalizePhone } from "../lib/documents.js";
import { AppError, USER_MESSAGES } from "../lib/app-errors.js";
import {
  assertCnpjAvailable,
  assertCpfAvailable,
  assertDocumentAvailable,
  assertEmailAvailable,
  assertPhoneAvailable,
} from "./registration-validation-service.js";
import { createAuditLog } from "./audit-service.js";
import { ensureUniqueUsername } from "../lib/username-utils.js";

type TutorInput = z.infer<typeof tutorRegisterSchema>;
type VeterinarianInput = z.infer<typeof veterinarianRegisterSchema>;
type ClinicInput = z.infer<typeof clinicRegisterSchema>;
type PetshopInput = z.infer<typeof petshopRegisterSchema>;
type SellerInput = z.infer<typeof sellerRegisterSchema>;
type ServiceProviderInput = z.infer<typeof serviceProviderRegisterSchema>;
type OngInput = z.infer<typeof ongRegisterSchema>;
type AdminInput = z.infer<typeof adminRegisterSchema>;

function normalizeDoc(value: string) {
  return value.replace(/\D/g, "");
}

function buildAddress(address: NonNullable<RegisterInput["address"]>): Prisma.AddressCreateWithoutUserInput {
  return {
    street: address.street,
    number: address.number || "S/N",
    complement: address.complement || undefined,
    district: address.district || "Centro",
    city: address.city,
    state: address.state.toUpperCase(),
    zipCode: address.zipCode || "00000-000",
    latitude: address.latitude ?? undefined,
    longitude: address.longitude ?? undefined,
  };
}

function accountStatusForRole(role: UserRole): AccountStatus {
  if (PENDING_APPROVAL_ROLES.includes(role)) return AccountStatus.PENDING;
  if (role === UserRole.ADMIN) return AccountStatus.PENDING;
  return AccountStatus.ACTIVE;
}

function accountStatusReasonForRole(role: UserRole): string | undefined {
  if (PENDING_APPROVAL_ROLES.includes(role) || role === UserRole.ADMIN) return "pending_approval";
  return undefined;
}

export async function registerUser(
  input: RegisterInput,
  ctx?: { ip?: string; userAgent?: string; allowInternal?: boolean }
) {
  const role = input.role as UserRole;

  if (role === UserRole.ADMIN && !ctx?.allowInternal) {
    throw new AppError(USER_MESSAGES.ADMIN_REGISTER_FORBIDDEN, 403, "ADMIN_REGISTER_FORBIDDEN");
  }

  const auditCtx = { ip: ctx?.ip, userAgent: ctx?.userAgent };

  await assertEmailAvailable(input.email, auditCtx);
  await assertPhoneAvailable(input.phone, auditCtx);

  let username =
    "username" in input && input.username ? String(input.username).toLowerCase() : undefined;

  if (!username && (role === UserRole.PETSHOP || role === UserRole.ONG)) {
    const hint =
      "tradeName" in input && input.tradeName
        ? String(input.tradeName)
        : "name" in input
          ? String(input.name)
          : undefined;
    username = await ensureUniqueUsername(input.email, hint);
  }

  if (username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) {
      throw new AppError("Este nome de usuário já está em uso. Escolha outro.", 409, "USERNAME_DUPLICATE");
    }
  }

  switch (role) {
    case UserRole.TUTOR:
      await assertCpfAvailable((input as TutorInput).cpf, auditCtx);
      break;
    case UserRole.VETERINARIAN:
      await assertCpfAvailable((input as VeterinarianInput).cpf, auditCtx);
      break;
    case UserRole.CLINIC:
      await assertCnpjAvailable((input as ClinicInput).cnpj, auditCtx);
      break;
    case UserRole.PETSHOP:
      await assertCnpjAvailable((input as PetshopInput).cnpj, auditCtx);
      break;
    case UserRole.SELLER:
      await assertCnpjAvailable((input as SellerInput).cnpj, auditCtx);
      break;
    case UserRole.SERVICE_PROVIDER: {
      const data = input as ServiceProviderInput;
      await assertDocumentAvailable(data.documentType, data.documentNumber, auditCtx);
      break;
    }
    case UserRole.ONG: {
      const data = input as OngInput;
      await assertDocumentAvailable(data.documentType, data.documentNumber, auditCtx);
      break;
    }
    case UserRole.ADMIN:
      await assertCpfAvailable((input as AdminInput).cpf, auditCtx);
      break;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();
  const accountStatus = accountStatusForRole(role);
  const accountStatusReason = accountStatusReasonForRole(role);
  const documents = input.documents ?? [];
  const isOrgAdmin = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER", "ONG"].includes(role);
  const normalizedPhone = normalizePhone(input.phone);

  const baseUser = {
    email: input.email.toLowerCase(),
    username,
    passwordHash,
    phone: normalizedPhone,
    role: input.role as UserRole,
    accountStatus,
    accountStatusReason,
    documents,
    isOrgAdmin,
    termsAcceptedAt: now,
    lgpdAcceptedAt: now,
    gamification: { create: {} },
  };

  let userData: Prisma.UserCreateInput;

  switch (role) {
    case UserRole.TUTOR: {
      const data = input as TutorInput;
      const cpf = cpfSchema.parse(data.cpf);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        cpf,
        birthDate: new Date(data.birthDate),
        address: { create: buildAddress(data.address) },
        tutorProfile: {
          create: {
            petCount: data.petCount ?? 0,
            primaryInterests: data.primaryInterests,
          },
        },
      };
      break;
    }
    case UserRole.VETERINARIAN: {
      const data = input as VeterinarianInput;
      const cpf = cpfSchema.parse(data.cpf);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        cpf,
        ...(data.address ? { address: { create: buildAddress(data.address) } } : {}),
        veterinarianProfile: {
          create: {
            crmv: data.crmv,
            crmvState: data.crmvState.toUpperCase(),
            specialties: [data.specialty],
            professionalAddress: data.professionalAddress,
            inPersonAvailable: data.inPersonAvailable,
            onlineAvailable: data.onlineAvailable,
            averageConsultationPrice: data.averageConsultationPrice,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.CLINIC: {
      const data = input as ClinicInput;
      const cnpj = cnpjSchema.parse(data.cnpj);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        address: { create: buildAddress(data.address) },
        clinicProfile: {
          create: {
            tradeName: data.tradeName.trim(),
            cnpj,
            technicalResponsible: data.technicalResponsible,
            responsibleCrmv: data.responsibleCrmv,
            hours: data.hours,
            services: data.services,
            emergency: data.emergency,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.PETSHOP: {
      const data = input as PetshopInput;
      const cnpj = cnpjSchema.parse(data.cnpj);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        address: { create: buildAddress(data.address) },
        petshopProfile: {
          create: {
            tradeName: data.tradeName.trim(),
            cnpj,
            responsible: data.responsible,
            sellsProducts: data.sellsProducts,
            offersServices: data.offersServices,
            categories: data.categories,
            hours: data.hours,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.SELLER: {
      const data = input as SellerInput;
      const cnpj = cnpjSchema.parse(data.cnpj);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        address: { create: buildAddress(data.address) },
        sellerProfile: {
          create: {
            tradeName: data.tradeName.trim(),
            cnpj,
            responsible: data.responsible,
            productCategories: data.productCategories,
            deliveryPolicy: data.deliveryPolicy,
            exchangePolicy: data.exchangePolicy,
            bankData: data.bankData,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.SERVICE_PROVIDER: {
      const data = input as ServiceProviderInput;
      const doc = normalizeDoc(data.documentNumber);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        cpf: data.documentType === "CPF" ? doc : undefined,
        ...(data.address ? { address: { create: buildAddress(data.address) } } : {}),
        serviceProviderProfile: {
          create: {
            documentType: data.documentType,
            documentNumber: doc,
            serviceTypes: data.serviceTypes,
            serviceArea: data.serviceArea,
            homeService: data.homeService,
            startingPrice: data.startingPrice,
            availability: data.availability,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.ONG: {
      const data = input as OngInput;
      const doc = normalizeDoc(data.documentNumber);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        cpf: data.documentType === "CPF" ? doc : undefined,
        address: { create: buildAddress(data.address) },
        ongProfile: {
          create: {
            name: data.name.trim(),
            tradeName: data.documentType === "CNPJ" ? data.tradeName?.trim() : data.name.trim(),
            documentType: data.documentType,
            cnpj: doc,
            responsible: data.responsible,
            actionTypes: data.actionTypes,
            animalCapacity: data.animalCapacity,
            acceptsDonations: data.acceptsDonations,
            documents,
          },
        },
      };
      break;
    }
    case UserRole.ADMIN: {
      const data = input as AdminInput;
      const cpf = cpfSchema.parse(data.cpf);
      userData = {
        ...baseUser,
        name: data.name.trim(),
        cpf,
        adminProfile: {
          create: {
            corporateEmail: data.corporateEmail,
            jobTitle: data.jobTitle,
            accessLevel: data.accessLevel,
          },
        },
      };
      break;
    }
    default:
      throw new AppError("Tipo de conta inválido", 400, "INVALID_ROLE");
  }

  const user = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountStatus: true,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    module: "auth",
    resource: "user_registration",
    resourceId: user.id,
    metadata: { role, accountStatus },
    ip: ctx?.ip,
    userAgent: ctx?.userAgent,
  });

  if (accountStatus === AccountStatus.PENDING) {
    const approvalType =
      role === UserRole.ONG ? "ONG" :
      role === UserRole.TUTOR ? "CLIENT" : "PARTNER";
    await prisma.approvalRequest.create({
      data: {
        type: approvalType,
        entityType: "User",
        entityId: user.id,
        requesterId: user.id,
        status: "PENDING",
        aiRiskScore: Math.random() * 0.3,
      },
    });
  }

  return {
    user,
    redirectTo: ROLE_REDIRECTS[role as keyof typeof ROLE_REDIRECTS] ?? "/dashboard",
  };
}
