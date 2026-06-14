import { z } from "zod";
import { PetSpecies } from "@prisma/client";

export const petCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  species: z.nativeEnum(PetSpecies),
  breed: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .refine((v) => {
      if (!v) return true;
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d <= new Date();
    }, "Data de nascimento não pode ser futura"),
  weight: z
    .number()
    .nonnegative("Peso não pode ser negativo")
    .optional()
    .nullable(),
  color: z.string().optional().nullable(),
  microchip: z.string().optional().nullable(),
  neutered: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
});

export const petUpdateSchema = petCreateSchema.partial().extend({
  name: z.string().min(1).optional(),
  species: z.nativeEnum(PetSpecies).optional(),
});

export const vaccinationSchema = z.object({
  name: z.string().min(1),
  appliedAt: z.string().refine((v) => new Date(v) <= new Date(), "Data não pode ser futura"),
  nextDueAt: z.string().optional().nullable(),
  veterinarianName: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const allergySchema = z.object({
  name: z.string().min(1),
  severity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const healthRecordSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  eventDate: z.string().refine((v) => new Date(v) <= new Date(), "Data não pode ser futura"),
  veterinarianName: z.string().optional().nullable(),
  clinicName: z.string().optional().nullable(),
});

export const reminderSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueAt: z.string(),
});

export const petDocumentSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  documentDate: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  sizeBytes: z.number().int().nonnegative().optional().nullable(),
});
