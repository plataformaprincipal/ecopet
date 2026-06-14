import { z } from "zod";
import { UserRole } from "@prisma/client";
import { onlyDigits } from "@/schemas/validation/documents-shared";
import {
  phoneSchema,
  cnpjSchema,
  birthDateSchema,
} from "@/schemas/auth";

const stateSchema = z
  .string()
  .length(2, "UF inválida")
  .transform((v) => v.toUpperCase());

const zipCodeSchema = z
  .string()
  .min(8, "CEP inválido")
  .transform((v) => onlyDigits(v))
  .refine((v) => v.length === 8, "CEP inválido");

const optionalZipCodeSchema = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v == null || v === "" ? null : onlyDigits(v)))
  .refine((v) => v === null || v.length === 8, "CEP inválido");

const optionalUrlSchema = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v.trim() === "") return null;
    return v.trim();
  })
  .refine((v) => v === null || /^https?:\/\/.+/i.test(v), "URL de avatar inválida");

const textField = (label: string, min = 2, max = 500) =>
  z.string().min(min, `${label} obrigatório`).max(max, `${label} muito longo`);

const optionalTextField = (max = 2000) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === "" ? null : v.trim()))
    .refine((v) => v === null || v.length <= max, "Texto muito longo");

import { cpfSchema } from "@/schemas/auth";

export const clientProfileUpdateSchema = z.object({
  name: textField("Nome"),
  phone: phoneSchema,
  birthDate: birthDateSchema,
  cpf: cpfSchema.optional(),
  address: textField("Endereço", 3),
  city: textField("Cidade"),
  state: stateSchema,
  zipCode: zipCodeSchema,
  avatarUrl: optionalUrlSchema,
});

export const partnerProfileUpdateSchema = z.object({
  businessName: textField("Nome fantasia"),
  legalName: textField("Razão social"),
  cnpj: cnpjSchema,
  category: textField("Categoria"),
  phone: phoneSchema,
  commercialEmail: z.string().email("E-mail comercial inválido").transform((v) => v.trim().toLowerCase()),
  responsibleName: textField("Responsável"),
  address: textField("Endereço", 3),
  city: textField("Cidade"),
  state: stateSchema,
  zipCode: optionalZipCodeSchema,
  description: optionalTextField(),
  businessHours: optionalTextField(500),
  avatarUrl: optionalUrlSchema,
});

export const ongProfileUpdateSchema = z.object({
  ongName: textField("Nome da ONG"),
  cnpj: cnpjSchema,
  responsibleName: textField("Responsável"),
  phone: phoneSchema,
  institutionalEmail: z.string().email("E-mail institucional inválido").transform((v) => v.trim().toLowerCase()),
  address: textField("Endereço", 3),
  city: textField("Cidade"),
  state: stateSchema,
  zipCode: optionalZipCodeSchema,
  description: optionalTextField(),
  focusArea: optionalTextField(500),
});

export type ClientProfileUpdate = z.infer<typeof clientProfileUpdateSchema>;
export type PartnerProfileUpdate = z.infer<typeof partnerProfileUpdateSchema>;
export type OngProfileUpdate = z.infer<typeof ongProfileUpdateSchema>;

export function getProfileUpdateSchema(role: UserRole) {
  switch (role) {
    case UserRole.CLIENT:
      return clientProfileUpdateSchema;
    case UserRole.PARTNER:
      return partnerProfileUpdateSchema;
    case UserRole.ONG:
      return ongProfileUpdateSchema;
    default:
      return null;
  }
}
