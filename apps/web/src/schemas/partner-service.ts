import { z } from "zod";
import { PetSpecies, PartnerServiceStatus, ServiceModality, ReadyServiceCategory } from "@prisma/client";

export const partnerServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  category: z.nativeEnum(ReadyServiceCategory),
  price: z.number().positive("Preço deve ser positivo"),
  durationMin: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(PartnerServiceStatus).optional(),
  modality: z.nativeEnum(ServiceModality).optional().nullable(),
  speciesTarget: z.nativeEnum(PetSpecies).optional().nullable(),
  notes: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
});

export const availabilitySlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  intervalMinutes: z.number().int().min(5).max(240).optional(),
  isActive: z.boolean().optional(),
});

export const blockedSlotSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().optional().nullable(),
});

export const appointmentCreateSchema = z.object({
  petId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.string(),
  notes: z.string().optional().nullable(),
});
