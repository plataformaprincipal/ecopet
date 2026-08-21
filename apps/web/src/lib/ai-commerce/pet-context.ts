import "server-only";
import { prisma } from "@/lib/prisma";
import { assertPetOwned } from "./entitlement-service";

export async function getAuthorizedPetContext(userId: string, petId: string) {
  await assertPetOwned(userId, petId);
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
        where: { userId, petId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { type: true, createdAt: true, structuredData: true },
      }),
      prisma.petHealthProfile.findUnique({ where: { petId } }).catch(() => null),
    ]);

  return {
    petProfile: pet as Record<string, unknown> | null,
    vaccinations,
    medications,
    allergies,
    exams,
    consultations,
    weightHistory: weights,
    previousReports: previous,
    healthProfile: profile,
    healthHistory: {
      allergies,
      exams,
      consultations,
      weights,
    },
  };
}
