import { z } from "zod";
import { UserRole } from "@prisma/client";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
} from "@/lib/password/validate-strong-password";

import { onlyDigits, validateCpfChecksum } from "./validation/documents-shared";

export const cpfSchema = z
  .string()
  .min(11, "CPF inválido")
  .transform(onlyDigits)
  .refine((v) => v.length === 11, "CPF inválido")
  .refine(validateCpfChecksum, "CPF inválido");

export const phoneSchema = z
  .string()
  .min(10, "Telefone inválido")
  .transform((v) => onlyDigits(v))
  .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido");

export const emailSchema = z.string().email("E-mail inválido").transform((v) => v.trim().toLowerCase());

const passwordSchema = z.string().min(1, "Senha obrigatória");
const confirmPasswordSchema = z.string().min(1, "Confirmar senha é obrigatório");

export const birthDateSchema = z
  .string()
  .min(1, "Data de nascimento obrigatória")
  .refine((v) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d <= today;
  }, "A data de nascimento não pode ser futura");

export const cnpjSchema = z
  .string()
  .min(14, "CNPJ inválido")
  .transform(onlyDigits)
  .refine((v) => v.length === 14, "CNPJ inválido");

const baseRegisterFields = z.object({
  role: z.nativeEnum(UserRole),
  name: z.string().min(2, "Nome obrigatório"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  phone: phoneSchema,
});

export const clientRegisterSchema = baseRegisterFields.extend({
  role: z.literal(UserRole.CLIENT),
  birthDate: birthDateSchema,
  cpf: cpfSchema.optional(),
  address: z.string().min(3, "Endereço inválido").optional(),
  city: z.string().min(2, "Cidade inválida").optional(),
  state: z.string().length(2, "UF inválida").transform((v) => v.toUpperCase()).optional(),
});

export const partnerRegisterSchema = baseRegisterFields.extend({
  role: z.literal(UserRole.PARTNER),
  businessName: z.string().min(2, "Nome fantasia obrigatório"),
  legalName: z.string().min(2, "Razão social obrigatória"),
  cnpj: cnpjSchema,
  category: z.string().min(2, "Categoria obrigatória"),
  address: z.string().min(3, "Endereço obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida").transform((v) => v.toUpperCase()),
});

export const ongRegisterSchema = baseRegisterFields.extend({
  role: z.literal(UserRole.ONG),
  ongName: z.string().min(2, "Nome da ONG obrigatório"),
  cnpj: cnpjSchema,
  responsibleName: z.string().min(2, "Responsável obrigatório"),
  address: z.string().min(3, "Endereço obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida").transform((v) => v.toUpperCase()),
});

const registerUnion = z.discriminatedUnion("role", [
  clientRegisterSchema,
  partnerRegisterSchema,
  ongRegisterSchema,
]);

export const registerSchema = registerUnion.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: PASSWORD_MISMATCH_MESSAGE,
    });
    return;
  }

  const result = validateStrongPassword(data.password, {
    email: data.email,
    name: data.name,
  });
  if (!result.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: result.error ?? "Senha não atende aos requisitos de segurança.",
    });
  }
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória"),
});

export type RegisterInput = z.infer<typeof registerUnion>;
export type LoginInput = z.infer<typeof loginSchema>;
