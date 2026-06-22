import { z } from "zod";
import { PetSpecies } from "@prisma/client";

export const ongDisplayStatusSchema = z.enum([
  "disponivel",
  "em_analise",
  "adotado",
  "indisponivel",
]);

export const ongAdoptionListingSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  species: z.nativeEnum(PetSpecies),
  breed: z.string().optional().nullable(),
  age: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  description: z.string().min(1, "Descrição obrigatória"),
  requirementsText: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  healthCondition: z.string().optional().nullable(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  displayStatus: ongDisplayStatusSchema.optional(),
});

export const ongAdoptionListingUpdateSchema = ongAdoptionListingSchema.partial();
