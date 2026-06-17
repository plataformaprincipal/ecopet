import { z } from "zod";
import { PetSpecies, PartnerServiceStatus, ServiceModality, ReadyServiceCategory, AppointmentAttendanceMode } from "@prisma/client";

const extraDetailsSchema = z
  .object({
    speciesTargets: z.array(z.string()).optional(),
    sizeTargets: z.array(z.string()).optional(),
    minAgeYears: z.number().nonnegative().optional(),
    maxAgeYears: z.number().nonnegative().optional(),
    requirements: z.string().optional(),
    requiredDocuments: z.string().optional(),
    petPreparation: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    availability: z.string().optional(),
    observations: z.string().optional(),
  })
  .optional()
  .nullable();

const partnerServiceBaseSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    description: z.string().min(3, "Descrição obrigatória"),
    shortDescription: z.string().optional().nullable(),
    subcategory: z.string().optional().nullable(),
    category: z.nativeEnum(ReadyServiceCategory),
    price: z.number().nonnegative(),
    priceOnRequest: z.boolean().optional(),
    durationMin: z.number().int().positive("Duração deve ser maior que zero").optional().nullable(),
    status: z.nativeEnum(PartnerServiceStatus).optional(),
    modality: z.nativeEnum(ServiceModality).optional().nullable(),
    speciesTarget: z.nativeEnum(PetSpecies).optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    serviceLocation: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
    extraDetails: extraDetailsSchema,
    notes: z.string().optional().nullable(),
    image: z.string().url().optional().nullable(),
  });

export const partnerServiceSchema = partnerServiceBaseSchema.superRefine((data, ctx) => {
    if (!data.priceOnRequest && data.price <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Preço deve ser maior que zero, exceto quando marcado como sob consulta",
        path: ["price"],
      });
    }
  });

export const partnerServiceUpdateSchema = partnerServiceBaseSchema.partial();

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
  attendanceMode: z.nativeEnum(AppointmentAttendanceMode).optional(),
  notes: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  pickupComplement: z.string().optional().nullable(),
  pickupReference: z.string().optional().nullable(),
  pickupPhone: z.string().optional().nullable(),
});
