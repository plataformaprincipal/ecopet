import { z } from "zod";
import { UserRole } from "@prisma/client";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
} from "@/lib/password/validate-strong-password";
import { normalizeFullName, isValidFullName, FULL_NAME_INCOMPLETE_MESSAGE } from "@/lib/validation/full-name";
import {
  isValidInternationalPhone,
  normalizeInternationalPhone,
  sanitizePhoneInput,
  PHONE_INVALID_MESSAGE,
  PHONE_REQUIRED_MESSAGE,
} from "@/lib/validation/international-phone";
import { isValidBrazilPhoneE164, normalizeBrazilPhoneFromE164 } from "@/lib/validation/brazil-phone";
import {
  EMAIL_INVALID_MESSAGE,
  isValidRegistrationEmail,
  normalizeRegistrationEmail,
} from "@/lib/validation/email";

import {
  validateBirthDate,
} from "@/lib/validation/birth-date";

import { onlyDigits, validateCpfChecksum } from "./validation/documents-shared";

export const cpfSchema = z
  .string()
  .min(11, "CPF inválido")
  .transform(onlyDigits)
  .refine((v) => v.length === 11, "CPF inválido")
  .refine(validateCpfChecksum, "CPF inválido");

function internationalPhoneRefine(value: string): boolean {
  const sanitized = sanitizePhoneInput(value);
  const digits = sanitized.replace(/\D/g, "");
  if (sanitized.startsWith("+55") || (digits.startsWith("55") && sanitized.startsWith("+"))) {
    const e164 = sanitized.startsWith("+") ? sanitized : `+${digits}`;
    return isValidBrazilPhoneE164(e164);
  }
  return isValidInternationalPhone(sanitized, "BR");
}

function internationalPhoneTransform(value: string): string {
  const sanitized = sanitizePhoneInput(value);
  const digits = sanitized.replace(/\D/g, "");
  if (sanitized.startsWith("+55") || (digits.startsWith("55") && sanitized.startsWith("+"))) {
    const e164 = sanitized.startsWith("+") ? sanitized : `+${digits}`;
    return normalizeBrazilPhoneFromE164(e164)!;
  }
  return normalizeInternationalPhone(sanitized, "BR")!;
}

export const phoneSchema = z
  .string()
  .min(1, PHONE_REQUIRED_MESSAGE)
  .transform((v) => sanitizePhoneInput(v.trim()))
  .refine((v) => !/[a-zA-Z]/.test(v), PHONE_INVALID_MESSAGE)
  .refine((v) => internationalPhoneRefine(v), PHONE_INVALID_MESSAGE)
  .transform((v) => internationalPhoneTransform(v));

export const clientPhoneSchema = z
  .string()
  .min(1, PHONE_REQUIRED_MESSAGE)
  .transform((v) => sanitizePhoneInput(v.trim()))
  .refine((v) => !/[a-zA-Z]/.test(v), PHONE_INVALID_MESSAGE)
  .refine((v) => internationalPhoneRefine(v), PHONE_INVALID_MESSAGE)
  .transform((v) => internationalPhoneTransform(v));

export const emailSchema = z
  .string()
  .min(1, EMAIL_INVALID_MESSAGE)
  .transform(normalizeRegistrationEmail)
  .refine(isValidRegistrationEmail, EMAIL_INVALID_MESSAGE);

export const LEGAL_ACCEPTANCE_MESSAGE =
  "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.";

const passwordSchema = z.string().min(1, "Senha obrigatória");
const confirmPasswordSchema = z.string().min(1, "Confirmar senha é obrigatório");

export const fullNameSchema = z
  .string()
  .min(1, "Nome completo obrigatório")
  .transform(normalizeFullName)
  .refine(isValidFullName, FULL_NAME_INCOMPLETE_MESSAGE)
  .refine((v) => v.length <= 120, "Nome deve ter no máximo 120 caracteres");

export const usernameSchema = z
  .string()
  .min(4, "Nome de usuário deve ter no mínimo 4 caracteres")
  .max(30, "Nome de usuário deve ter no máximo 30 caracteres")
  .regex(/^[a-zA-Z0-9_.]+$/, "Use apenas letras, números, _ e .")
  .transform((v) => v.toLowerCase());

export const clientGenderSchema = z.enum(
  ["MASCULINO", "FEMININO", "NAO_BINARIO", "NAO_DECLARAR", "OUTRO"],
  { errorMap: () => ({ message: "Informe o gênero ou selecione uma das opções disponíveis." }) }
);

export const birthDateSchema = z
  .string()
  .min(1, "Data de nascimento obrigatória")
  .superRefine((v, ctx) => {
    const message = validateBirthDate(v);
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

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
  name: fullNameSchema,
  phone: clientPhoneSchema,
  birthDate: birthDateSchema,
  username: usernameSchema,
  gender: clientGenderSchema,
  genderOther: z.string().max(60, "Informe até 60 caracteres").optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: LEGAL_ACCEPTANCE_MESSAGE }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: LEGAL_ACCEPTANCE_MESSAGE }) }),
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
  if (data.role === UserRole.CLIENT && data.gender === "OUTRO" && (!data.genderOther || data.genderOther.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["genderOther"],
      message: "Informe seu gênero",
    });
    return;
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: PASSWORD_MISMATCH_MESSAGE,
    });
    return;
  }

  const pwdContext =
    data.role === UserRole.CLIENT
      ? {
          email: data.email,
          name: data.name,
          username: data.username,
          phone: data.phone,
          birthDate: data.birthDate,
        }
      : { email: data.email, name: data.name };

  const result = validateStrongPassword(data.password, pwdContext);
  if (!result.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: result.error ?? "Senha não atende aos requisitos de segurança.",
    });
  }
});

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, "Senha obrigatória"),
  })
  .transform((data) => ({
    identifier: (data.identifier ?? data.email ?? "").trim(),
    password: data.password,
  }))
  .refine((data) => data.identifier.length > 0, {
    message: "Informe e-mail ou nome de usuário",
    path: ["identifier"],
  });

export type RegisterInput = z.infer<typeof registerUnion>;
export type LoginInput = z.infer<typeof loginSchema>;

export const CLIENT_GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "NAO_BINARIO", label: "Não Binário" },
  { value: "NAO_DECLARAR", label: "Prefiro Não Declarar" },
  { value: "OUTRO", label: "Outro" },
] as const;
