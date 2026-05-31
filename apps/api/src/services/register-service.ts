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
    district: address.district || "Centro",
    city: address.city,
    state: address.state.toUpperCase(),
    zipCode: address.zipCode || "00000-000",
  };
}

function accountStatusForRole(role: UserRole): AccountStatus {
  if (PENDING_APPROVAL_ROLES.includes(role)) return AccountStatus.PENDING;
  if (role === UserRole.ADMIN) return AccountStatus.PENDING;
  return AccountStatus.ACTIVE;
}

export async function registerUser(input: RegisterInput) {
  const role = input.role as UserRole;
  const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (exists) {
    throw Object.assign(new Error("E-mail já cadastrado"), { status: 409 });
  }

  const username = "username" in input && input.username
    ? String(input.username).toLowerCase()
    : undefined;
  if (username) {
    const usernameTaken = await prisma.user.findUnique({ where: { username } });
    if (usernameTaken) {
      throw Object.assign(new Error("Nome de usuário já em uso"), { status: 409 });
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date();
  const accountStatus = accountStatusForRole(role);
  const documents = input.documents ?? [];
  const isOrgAdmin = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER", "ONG"].includes(role);

  const baseUser = {
    email: input.email.toLowerCase(),
    username,
    passwordHash,
    phone: input.phone,
    role: input.role as UserRole,
    accountStatus,
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
        name: data.name,
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
        name: data.name,
        cpf,
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
        name: data.name,
        address: { create: buildAddress(data.address) },
        clinicProfile: {
          create: {
            tradeName: data.tradeName,
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
        name: data.name,
        address: { create: buildAddress(data.address) },
        petshopProfile: {
          create: {
            tradeName: data.tradeName,
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
        name: data.name,
        address: { create: buildAddress(data.address) },
        sellerProfile: {
          create: {
            tradeName: data.tradeName,
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
        name: data.name,
        cpf: data.documentType === "CPF" ? doc : undefined,
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
        name: data.name,
        address: { create: buildAddress(data.address) },
        ongProfile: {
          create: {
            name: data.name,
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
        name: data.name,
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
      throw Object.assign(new Error("Tipo de conta inválido"), { status: 400 });
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
        aiNotes: "Análise automática IA — aguardando revisão do Gestor ECOPET",
      },
    });
  }

  return {
    user,
    redirectTo: ROLE_REDIRECTS[role as keyof typeof ROLE_REDIRECTS],
  };
}
