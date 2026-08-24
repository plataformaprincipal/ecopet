import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPetOwned } from "./entitlement-service";

export type PetAIContext = {
  identity?: {
    name?: string;
    species?: string;
    breed?: string | null;
    sex?: string | null;
    birthDate?: string | null;
    age?: string | null;
    neutered?: boolean | null;
    photo?: string | null;
  };
  anthropometrics?: {
    weight?: number | null;
    weightHistory?: Array<{ weight: number; recordedAt: string; notes?: string | null }>;
    bodyConditionScore?: number | null;
  };
  health?: {
    allergies?: unknown[];
    conditions?: string | null;
    surgeries?: unknown[];
    previousEvents?: unknown[];
  };
  vaccines?: unknown[];
  medications?: unknown[];
  exams?: unknown[];
  nutrition?: { diet?: string | null; restriction?: string | null };
  dental?: unknown[];
  behavior?: unknown[];
  appointments?: unknown[];
  documents?: unknown[];
  previousReports?: unknown[];
};

function ageFromBirthDate(birthDate: Date | null | undefined): string | null {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (years < 0) return null;
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

export async function buildPetAIContext(params: {
  userId: string;
  petId: string;
  capabilityId?: string;
}): Promise<PetAIContext> {
  await assertPetOwned(params.userId, params.petId);
  const petId = params.petId;
  const [pet, vaccinations, medications, allergies, exams, consultations, weights, previous, profile] =
    await Promise.all([
      prisma.pet.findUnique({
        where: { id: petId },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          sex: true,
          birthDate: true,
          weight: true,
          photo: true,
          notes: true,
          diet: true,
          activityLevel: true,
          allergiesText: true,
          dietaryRestriction: true,
          specialNeeds: true,
          neutered: true,
        },
      }),
      prisma.vaccination.findMany({
        where: { petId },
        orderBy: { date: "desc" },
        take: 30,
        select: { name: true, date: true, nextDue: true, manufacturer: true, batch: true },
      }).catch(() => []),
      prisma.medication.findMany({
        where: { petId },
        take: 30,
        select: { name: true, dosage: true, frequency: true, startDate: true, endDate: true, notes: true },
      }).catch(() => []),
      prisma.allergy.findMany({ where: { petId }, take: 20 }).catch(() => []),
      prisma.exam.findMany({
        where: { petId },
        orderBy: { date: "desc" },
        take: 20,
        select: { type: true, date: true, result: true },
      }).catch(() => []),
      prisma.consultation.findMany({
        where: { petId },
        orderBy: { date: "desc" },
        take: 10,
        select: { date: true, type: true, notes: true },
      }).catch(() => []),
      prisma.petWeightRecord.findMany({
        where: { petId },
        orderBy: { recordedAt: "desc" },
        take: 40,
        select: { weight: true, recordedAt: true, notes: true },
      }).catch(() => []),
      prisma.aIReport.findMany({
        where: { userId: params.userId, petId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { type: true, createdAt: true, structuredData: true },
      }),
      prisma.petHealthProfile.findUnique({ where: { petId } }).catch(() => null),
    ]);

  const ctx: PetAIContext = {};
  if (pet) {
    ctx.identity = {
      name: pet.name,
      species: pet.species,
      ...(pet.breed ? { breed: pet.breed } : {}),
      ...(pet.sex ? { sex: pet.sex } : {}),
      ...(pet.birthDate ? { birthDate: pet.birthDate.toISOString(), age: ageFromBirthDate(pet.birthDate) } : {}),
      ...(pet.neutered != null ? { neutered: pet.neutered } : {}),
      ...(pet.photo ? { photo: pet.photo } : {}),
    };
    const history = weights.map((w) => ({
      weight: w.weight,
      recordedAt: w.recordedAt.toISOString(),
      notes: w.notes,
    }));
    if (pet.weight != null || history.length) {
      ctx.anthropometrics = {
        ...(pet.weight != null ? { weight: pet.weight } : {}),
        ...(history.length ? { weightHistory: history } : {}),
      };
    }
    const allergyList = [
      ...allergies,
      ...(pet.allergiesText ? [{ name: pet.allergiesText, source: "USER_REPORTED" }] : []),
    ];
    if (allergyList.length || pet.specialNeeds || pet.notes) {
      ctx.health = {
        ...(allergyList.length ? { allergies: allergyList } : {}),
        ...(pet.specialNeeds ? { conditions: pet.specialNeeds } : {}),
        ...(consultations.length ? { previousEvents: consultations } : {}),
      };
    }
    if (pet.diet || pet.dietaryRestriction) {
      ctx.nutrition = {
        ...(pet.diet ? { diet: pet.diet } : {}),
        ...(pet.dietaryRestriction ? { restriction: pet.dietaryRestriction } : {}),
      };
    }
  }
  if (vaccinations.length) ctx.vaccines = vaccinations;
  if (medications.length) ctx.medications = medications;
  if (exams.length) ctx.exams = exams;
  if (consultations.length) ctx.appointments = consultations;
  if (previous.length) ctx.previousReports = previous;
  if (profile?.lastSummary && typeof profile.lastSummary === "object") {
    const summary = profile.lastSummary as Record<string, unknown>;
    if (Array.isArray(summary.dental) && summary.dental.length) ctx.dental = summary.dental;
    if (Array.isArray(summary.behavior) && summary.behavior.length) ctx.behavior = summary.behavior;
    if (Array.isArray(summary.documents) && summary.documents.length) ctx.documents = summary.documents;
  }
  void params.capabilityId;
  return ctx;
}

export async function getAuthorizedPetContext(userId: string, petId: string) {
  const structured = await buildPetAIContext({ userId, petId });
  return {
    petProfile: structured.identity ? { ...structured.identity, ...structured.anthropometrics, ...structured.nutrition } : null,
    vaccinations: structured.vaccines ?? [],
    medications: structured.medications ?? [],
    allergies: structured.health?.allergies ?? [],
    exams: structured.exams ?? [],
    consultations: structured.appointments ?? [],
    weightHistory: structured.anthropometrics?.weightHistory ?? [],
    previousReports: structured.previousReports ?? [],
    healthProfile: structured,
    healthHistory: {
      allergies: structured.health?.allergies ?? [],
      exams: structured.exams ?? [],
      consultations: structured.appointments ?? [],
      weights: structured.anthropometrics?.weightHistory ?? [],
    },
    petAIContext: structured,
  };
}
