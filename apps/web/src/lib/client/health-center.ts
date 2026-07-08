import type { PrismaClient } from "@prisma/client";

/**
 * Central de Saúde — agregação de dados REAIS de saúde dos pets do tutor.
 * Cirurgias e doenças não possuem modelo dedicado no schema atual → retornam vazios.
 */

export type HealthCenter = {
  petsCount: number;
  counts: {
    vaccines: number;
    medications: number;
    exams: number;
    consultations: number;
    allergies: number;
    weightRecords: number;
  };
  vaccines: Array<{ id: string; name: string; petName: string; date: string; nextDue: string | null }>;
  medications: Array<{ id: string; name: string; petName: string; frequency: string | null; startDate: string | null; endDate: string | null }>;
  weights: Array<{ id: string; petName: string; weight: number; recordedAt: string }>;
  exams: Array<{ id: string; type: string; petName: string; date: string; result: string | null }>;
  consultations: Array<{ id: string; type: string | null; petName: string; date: string; notes: string | null }>;
  allergies: Array<{ id: string; allergen: string; petName: string; severity: string | null }>;
  records: Array<{ id: string; title: string; type: string; petName: string; recordDate: string }>;
  surgeries: never[];
  diseases: never[];
};

export async function buildHealthCenter(prisma: PrismaClient, userId: string): Promise<HealthCenter> {
  const pets = await prisma.pet.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  const petIds = pets.map((p) => p.id);

  if (petIds.length === 0) {
    return {
      petsCount: 0,
      counts: { vaccines: 0, medications: 0, exams: 0, consultations: 0, allergies: 0, weightRecords: 0 },
      vaccines: [],
      medications: [],
      weights: [],
      exams: [],
      consultations: [],
      allergies: [],
      records: [],
      surgeries: [],
      diseases: [],
    };
  }

  const petInclude = { pet: { select: { name: true } } };

  const [vaccines, medications, weights, exams, consultations, allergies, records] = await Promise.all([
    prisma.vaccination.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { date: "desc" }, take: 50 }),
    prisma.medication.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { startDate: "desc" }, take: 50 }),
    prisma.petWeightRecord.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { recordedAt: "desc" }, take: 50 }),
    prisma.exam.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { date: "desc" }, take: 50 }),
    prisma.consultation.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { date: "desc" }, take: 50 }),
    prisma.allergy.findMany({ where: { petId: { in: petIds } }, include: petInclude, take: 50 }),
    prisma.medicalRecord.findMany({ where: { petId: { in: petIds } }, include: petInclude, orderBy: { recordDate: "desc" }, take: 50 }),
  ]);

  return {
    petsCount: petIds.length,
    counts: {
      vaccines: vaccines.length,
      medications: medications.length,
      exams: exams.length,
      consultations: consultations.length,
      allergies: allergies.length,
      weightRecords: weights.length,
    },
    vaccines: vaccines.map((v) => ({
      id: v.id,
      name: v.name,
      petName: v.pet.name,
      date: v.date.toISOString(),
      nextDue: v.nextDue ? v.nextDue.toISOString() : null,
    })),
    medications: medications.map((m) => ({
      id: m.id,
      name: m.name,
      petName: m.pet.name,
      frequency: m.frequency ?? null,
      startDate: m.startDate ? m.startDate.toISOString() : null,
      endDate: m.endDate ? m.endDate.toISOString() : null,
    })),
    weights: weights.map((w) => ({
      id: w.id,
      petName: w.pet.name,
      weight: w.weight,
      recordedAt: w.recordedAt.toISOString(),
    })),
    exams: exams.map((e) => ({
      id: e.id,
      type: e.type,
      petName: e.pet.name,
      date: e.date.toISOString(),
      result: e.result ?? null,
    })),
    consultations: consultations.map((c) => ({
      id: c.id,
      type: c.type ?? null,
      petName: c.pet.name,
      date: c.date.toISOString(),
      notes: c.notes ?? null,
    })),
    allergies: allergies.map((a) => ({
      id: a.id,
      allergen: a.allergen,
      petName: a.pet.name,
      severity: a.severity ?? null,
    })),
    records: records.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      petName: r.pet.name,
      recordDate: r.recordDate.toISOString(),
    })),
    surgeries: [],
    diseases: [],
  };
}
