import crypto from "crypto";
import { prisma } from "@ecopet/database";
import type { PetSpecies, PetSize, UserRole } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "./audit-service.js";
import { AppError } from "../lib/app-errors.js";

export const MEDICAL_RECORD_TYPES = [
  "CONSULTATION",
  "EXAM",
  "SURGERY",
  "HOSPITALIZATION",
  "DIAGNOSIS",
  "PRESCRIPTION",
  "MEDICATION",
  "CERTIFICATE",
  "REPORT",
] as const;

export const VACCINE_PRESETS = [
  "V10", "V8", "Antirrábica", "Giárdia", "Leishmaniose", "Gripe Canina",
  "Tríplice Felina", "Quádrupla Felina", "Leucemia Felina",
];

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function canAccessPet(petId: string, userId: string, role: UserRole) {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) return { allowed: false as const, pet: null, canEdit: false, canMedical: false };

  if (role === "GESTOR" || role === "ADMIN") {
    return { allowed: true as const, pet, canEdit: true, canMedical: true };
  }

  const isOwner = pet.ownerId === userId;
  const isOng = pet.ongId === userId;
  const isProtector = pet.protectorId === userId;

  if (role === "VETERINARIAN") {
    return { allowed: isOwner || isOng || isProtector, pet, canEdit: false, canMedical: true };
  }

  if (role === "ONG") {
    return { allowed: isOwner || isOng, pet, canEdit: isOwner || isOng, canMedical: false };
  }

  if (isOwner || isOng || isProtector) {
    return { allowed: true, pet, canEdit: true, canMedical: false };
  }

  return { allowed: false as const, pet: null, canEdit: false, canMedical: false };
}

export async function listPetsForUser(userId: string, role: UserRole) {
  const where =
    role === "GESTOR" || role === "ADMIN"
      ? {}
      : role === "ONG"
        ? { OR: [{ ownerId: userId }, { ongId: userId }] }
        : { OR: [{ ownerId: userId }, { ongId: userId }, { protectorId: userId }] };

  return prisma.pet.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true } },
      ong: { select: { id: true, name: true } },
      protector: { select: { id: true, name: true } },
      _count: { select: { vaccinations: true, medicalRecords: true, weightRecords: true } },
    },
  });
}

const petInclude = {
  owner: { select: { id: true, name: true, email: true, phone: true } },
  ong: { select: { id: true, name: true } },
  protector: { select: { id: true, name: true } },
  vaccinations: { orderBy: { date: "desc" as const } },
  medications: { orderBy: { startDate: "desc" as const } },
  medicalRecords: { orderBy: { recordDate: "desc" as const }, include: { author: { select: { id: true, name: true, role: true } } } },
  weightRecords: { orderBy: { recordedAt: "desc" as const } },
  media: { orderBy: { recordedAt: "desc" as const } },
  events: { orderBy: { createdAt: "desc" as const }, take: 50, include: { createdBy: { select: { id: true, name: true } } } },
  allergies: true,
};

export async function getPetDetail(petId: string, userId: string, role: UserRole) {
  const access = await canAccessPet(petId, userId, role);
  if (!access.allowed || !access.pet) throw new AppError("Pet não encontrado ou acesso negado.", 404, "PET_NOT_FOUND");
  return prisma.pet.findUnique({ where: { id: petId }, include: petInclude });
}

export async function logPetEvent(params: {
  petId: string;
  eventType: string;
  title: string;
  description?: string;
  createdById?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.petEvent.create({
    data: {
      petId: params.petId,
      eventType: params.eventType,
      title: params.title,
      description: params.description,
      createdById: params.createdById,
      metadata: asOptionalInputJson(params.metadata ?? undefined),
    },
  });
}

async function auditPetChange(params: {
  userId: string;
  petId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await createAuditLog({
    userId: params.userId,
    action: params.action,
    module: "pets",
    resource: "pet",
    resourceId: params.petId,
    metadata: params.metadata,
    ip: params.ip,
  });
}

export async function createPet(params: {
  userId: string;
  role: UserRole;
  data: {
    name: string;
    species: PetSpecies;
    breed: string;
    sex: string;
    birthDate?: string;
    color: string;
    weight?: number;
    size?: PetSize;
    neutered?: boolean;
    hasMicrochip?: boolean;
    microchip?: string;
    photo?: string;
    photos?: unknown[];
    temperament?: string;
    rescueHistory?: string;
    specialNeeds?: string;
    dietaryRestriction?: string;
    allergiesText?: string;
    notes?: string;
    ongId?: string;
    protectorId?: string;
    locationAddress?: string;
    locationCity?: string;
    locationState?: string;
    publicProfile?: boolean;
  };
  ip?: string;
}) {
  const qrCodeSlug = slugify(params.data.name);
  const pet = await prisma.pet.create({
    data: {
      ownerId: params.userId,
      ongId: params.data.ongId,
      protectorId: params.data.protectorId,
      name: params.data.name,
      species: params.data.species,
      breed: params.data.breed,
      sex: params.data.sex,
      birthDate: params.data.birthDate ? new Date(params.data.birthDate) : undefined,
      color: params.data.color,
      weight: params.data.weight,
      size: params.data.size,
      neutered: params.data.neutered ?? false,
      hasMicrochip: params.data.hasMicrochip ?? false,
      microchip: params.data.microchip,
      photo: params.data.photo,
      photos: asOptionalInputJson(params.data.photos ?? undefined),
      temperament: params.data.temperament,
      rescueHistory: params.data.rescueHistory,
      specialNeeds: params.data.specialNeeds,
      dietaryRestriction: params.data.dietaryRestriction,
      allergiesText: params.data.allergiesText,
      notes: params.data.notes,
      locationAddress: params.data.locationAddress,
      locationCity: params.data.locationCity,
      locationState: params.data.locationState,
      publicProfile: params.data.publicProfile ?? false,
      qrCodeSlug,
      aiProfile: {
        enabled: false,
        capabilities: ["symptoms", "vaccines", "medical_history", "weight", "feeding"],
        lastAnalysisAt: null,
        insights: [],
      },
    },
    include: petInclude,
  });

  if (params.data.weight) {
    await prisma.petWeightRecord.create({
      data: { petId: pet.id, weight: params.data.weight, notes: "Peso inicial" },
    });
  }

  await logPetEvent({
    petId: pet.id,
    eventType: "registration",
    title: "Pet cadastrado",
    description: `${pet.name} foi cadastrado na ECOPET`,
    createdById: params.userId,
  });

  await auditPetChange({ userId: params.userId, petId: pet.id, action: "CREATE", ip: params.ip, metadata: { name: pet.name } });
  return pet;
}

export async function updatePet(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: Record<string, unknown>;
  ip?: string;
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão para editar este pet.", 403, "PET_FORBIDDEN");

  const { birthDate, weight, ...rest } = params.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (typeof birthDate === "string") updateData.birthDate = new Date(birthDate);

  const before = access.pet!;
  const pet = await prisma.pet.update({
    where: { id: params.petId },
    data: updateData,
    include: petInclude,
  });

  if (typeof weight === "number" && weight !== before.weight) {
    await prisma.petWeightRecord.create({
      data: { petId: pet.id, weight, notes: "Atualização de peso" },
    });
    await logPetEvent({
      petId: pet.id,
      eventType: "weight",
      title: "Peso atualizado",
      description: `Novo peso: ${weight} kg`,
      createdById: params.userId,
    });
  }

  await logPetEvent({
    petId: pet.id,
    eventType: "update",
    title: "Dados atualizados",
    description: "Perfil do pet foi atualizado",
    createdById: params.userId,
    metadata: { fields: Object.keys(params.data) },
  });

  await auditPetChange({
    userId: params.userId,
    petId: pet.id,
    action: "UPDATE",
    ip: params.ip,
    metadata: { before: { name: before.name, weight: before.weight }, after: { name: pet.name, weight: pet.weight } },
  });

  return pet;
}

export async function addMedicalRecord(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: {
    type: string;
    title: string;
    content?: string;
    recordDate?: string;
    veterinarianName?: string;
    clinicName?: string;
    attachments?: unknown[];
  };
  ip?: string;
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || (!access.canEdit && !access.canMedical)) {
    throw new AppError("Sem permissão para adicionar registros médicos.", 403, "PET_FORBIDDEN");
  }

  const record = await prisma.medicalRecord.create({
    data: {
      petId: params.petId,
      authorId: params.userId,
      type: params.data.type,
      title: params.data.title,
      content: params.data.content,
      recordDate: params.data.recordDate ? new Date(params.data.recordDate) : new Date(),
      veterinarianName: params.data.veterinarianName,
      clinicName: params.data.clinicName,
      attachments: asOptionalInputJson(params.data.attachments ?? undefined),
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  await logPetEvent({
    petId: params.petId,
    eventType: params.data.type.toLowerCase(),
    title: params.data.title,
    description: params.data.content,
    createdById: params.userId,
  });

  await auditPetChange({ userId: params.userId, petId: params.petId, action: "CREATE", ip: params.ip, metadata: { medicalRecordId: record.id } });
  return record;
}

export async function addVaccination(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: {
    name: string;
    manufacturer?: string;
    batch?: string;
    date: string;
    nextDue?: string;
    veterinarian?: string;
    notes?: string;
  };
  ip?: string;
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || (!access.canEdit && !access.canMedical)) {
    throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");
  }

  const vaccination = await prisma.vaccination.create({
    data: {
      petId: params.petId,
      name: params.data.name,
      manufacturer: params.data.manufacturer,
      batch: params.data.batch,
      date: new Date(params.data.date),
      nextDue: params.data.nextDue ? new Date(params.data.nextDue) : undefined,
      veterinarian: params.data.veterinarian,
      notes: params.data.notes,
    },
  });

  await logPetEvent({
    petId: params.petId,
    eventType: "vaccine",
    title: `Vacina: ${params.data.name}`,
    description: params.data.notes,
    createdById: params.userId,
  });

  await auditPetChange({ userId: params.userId, petId: params.petId, action: "CREATE", ip: params.ip, metadata: { vaccinationId: vaccination.id } });
  return vaccination;
}

export async function addMedication(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: {
    name: string;
    dosage?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
  ip?: string;
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || (!access.canEdit && !access.canMedical)) {
    throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");
  }

  const medication = await prisma.medication.create({ data: { petId: params.petId, ...params.data, startDate: params.data.startDate ? new Date(params.data.startDate) : undefined, endDate: params.data.endDate ? new Date(params.data.endDate) : undefined } });

  await logPetEvent({
    petId: params.petId,
    eventType: "medication",
    title: `Medicação: ${params.data.name}`,
    createdById: params.userId,
  });

  return medication;
}

export async function addWeightRecord(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: { weight: number; recordedAt?: string; notes?: string };
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");

  const record = await prisma.petWeightRecord.create({
    data: {
      petId: params.petId,
      weight: params.data.weight,
      recordedAt: params.data.recordedAt ? new Date(params.data.recordedAt) : new Date(),
      notes: params.data.notes,
    },
  });

  await prisma.pet.update({ where: { id: params.petId }, data: { weight: params.data.weight } });

  await logPetEvent({
    petId: params.petId,
    eventType: "weight",
    title: "Peso registrado",
    description: `${params.data.weight} kg`,
    createdById: params.userId,
  });

  return record;
}

export async function addMedia(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: { type: string; url: string; caption?: string; recordedAt?: string };
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");

  return prisma.petMedia.create({
    data: {
      petId: params.petId,
      type: params.data.type,
      url: params.data.url,
      caption: params.data.caption,
      recordedAt: params.data.recordedAt ? new Date(params.data.recordedAt) : new Date(),
    },
  });
}

export async function markPetLost(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: { lostCity: string; lostContact: string; lostAt?: string };
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");

  const pet = await prisma.pet.update({
    where: { id: params.petId },
    data: {
      isLost: true,
      lostCity: params.data.lostCity,
      lostContact: params.data.lostContact,
      lostAt: params.data.lostAt ? new Date(params.data.lostAt) : new Date(),
      publicProfile: true,
    },
    include: petInclude,
  });

  await logPetEvent({
    petId: params.petId,
    eventType: "lost",
    title: "Pet marcado como perdido",
    description: params.data.lostCity,
    createdById: params.userId,
  });

  return pet;
}

export async function markPetFound(params: { petId: string; userId: string; role: UserRole }) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");

  const pet = await prisma.pet.update({
    where: { id: params.petId },
    data: { isLost: false, lostAt: null, lostCity: null, lostContact: null },
    include: petInclude,
  });

  await logPetEvent({
    petId: params.petId,
    eventType: "found",
    title: "Pet encontrado",
    createdById: params.userId,
  });

  return pet;
}

export async function setAdoption(params: {
  petId: string;
  userId: string;
  role: UserRole;
  data: {
    availableForAdoption: boolean;
    adoptionReason?: string;
    adoptionRequirements?: string;
    adoptionCity?: string;
    adoptionFee?: number;
  };
}) {
  const access = await canAccessPet(params.petId, params.userId, params.role);
  if (!access.allowed || !access.canEdit) throw new AppError("Sem permissão.", 403, "PET_FORBIDDEN");

  const pet = await prisma.pet.update({
    where: { id: params.petId },
    data: {
      availableForAdoption: params.data.availableForAdoption,
      adoptionReason: params.data.adoptionReason,
      adoptionRequirements: params.data.adoptionRequirements,
      adoptionCity: params.data.adoptionCity,
      adoptionFee: params.data.adoptionFee,
      publicProfile: params.data.availableForAdoption ? true : undefined,
    },
    include: petInclude,
  });

  if (params.data.availableForAdoption) {
    await logPetEvent({
      petId: params.petId,
      eventType: "adoption",
      title: "Disponível para adoção",
      description: params.data.adoptionReason,
      createdById: params.userId,
    });
  }

  return pet;
}

export async function getPublicPet(slug: string) {
  const pet = await prisma.pet.findFirst({
    where: {
      qrCodeSlug: slug,
      OR: [{ publicProfile: true }, { isLost: true }, { availableForAdoption: true }],
    },
    select: {
      id: true,
      name: true,
      photo: true,
      species: true,
      breed: true,
      color: true,
      sex: true,
      birthDate: true,
      weight: true,
      size: true,
      microchip: true,
      hasMicrochip: true,
      qrCodeSlug: true,
      locationCity: true,
      locationState: true,
      isLost: true,
      lostAt: true,
      lostCity: true,
      lostContact: true,
      availableForAdoption: true,
      adoptionReason: true,
      adoptionRequirements: true,
      adoptionCity: true,
      adoptionFee: true,
      temperament: true,
      photos: true,
      owner: { select: { name: true } },
    },
  });
  if (!pet) throw new AppError("Pet não encontrado.", 404, "PET_NOT_FOUND");
  return pet;
}

export function computePetAge(birthDate: Date | null | undefined): string {
  if (!birthDate) return "Idade não informada";
  const now = new Date();
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  if (months < 12) return `${Math.max(months, 0)} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${rem}m`;
}

export function getVaccineAlerts(vaccinations: { name: string; nextDue: Date | null }[]) {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return vaccinations
    .filter((v) => v.nextDue)
    .map((v) => {
      const due = v.nextDue!;
      if (due < now) return { name: v.name, status: "overdue" as const, message: `${v.name} está atrasada` };
      if (due <= in30) return { name: v.name, status: "soon" as const, message: `${v.name} vence em breve` };
      return null;
    })
    .filter(Boolean);
}

export function getMedicationReminders(medications: { name: string; endDate: Date | null; frequency?: string | null }[]) {
  const now = new Date();
  return medications
    .filter((m) => !m.endDate || m.endDate >= now)
    .map((m) => ({
      name: m.name,
      message: m.frequency ? `${m.name}: ${m.frequency}` : m.name,
    }));
}
