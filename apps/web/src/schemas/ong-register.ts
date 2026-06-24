import { z } from "zod";
import { UserRole } from "@prisma/client";
import {
  emailSchema,
  fullNameSchema,
  phoneSchema,
  cpfSchema,
} from "@/schemas/auth";
import { usernameSchema } from "@/lib/validation/username";
import { PASSWORD_MISMATCH_MESSAGE, validateStrongPassword } from "@/lib/password/validate-strong-password";
import { validateActivityStartDate } from "@/lib/validation/activity-start-date";
import { onlyDigits, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import { ONG_LEGAL, ONG_LEGAL_ACCEPTANCE_MESSAGE } from "@/lib/legal/legal-links";
import { validateRequiredOngDocuments } from "@/lib/ong/document-validation";

export const ONG_CNPJ_INVALID_MESSAGE = "Digite um CNPJ válido.";

export const ongCnpjSchema = z
  .string()
  .min(1, ONG_CNPJ_INVALID_MESSAGE)
  .transform(onlyDigits)
  .refine((v) => v.length === 14, ONG_CNPJ_INVALID_MESSAGE)
  .refine((v) => !/^(\d)\1+$/.test(v), ONG_CNPJ_INVALID_MESSAGE)
  .refine(validateCnpjChecksum, ONG_CNPJ_INVALID_MESSAGE);

const profileDetailsSchema = z
  .object({
    mission: z.string().optional(),
    vision: z.string().optional(),
    pixKey: z.string().optional(),
    representativeRole: z.string().optional(),
    activityStartDate: z.string().optional(),
    foundedDate: z.string().optional(),
    socialLinks: z
      .object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        linkedin: z.string().optional(),
        youtube: z.string().optional(),
        whatsapp: z.string().optional(),
        website: z.string().optional(),
      })
      .optional(),
    profileImageUrl: z.string().url().optional(),
    coverImageUrl: z.string().url().optional(),
    logoUrl: z.string().url().optional(),
  })
  .optional();

const verificationDocumentSchema = z.object({
  id: z.string(),
  type: z.string(),
  typeLabel: z.string(),
  fileName: z.string(),
  url: z.string().url(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedAt: z.string(),
});

const ongBaseSchema = z.object({
  role: z.literal(UserRole.ONG),
  name: fullNameSchema,
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória"),
  confirmPassword: z.string().min(1, "Confirmar senha é obrigatório"),
  phone: phoneSchema,
  username: usernameSchema,
  cpf: cpfSchema,
  actionTypes: z.array(z.string()).min(1, "Selecione ao menos uma área de atuação."),
  actionTypesOther: z.string().optional(),
  description: z
    .string()
    .min(40, "Descreva melhor sua causa ou instituição.")
    .max(1200, "A descrição deve ter no máximo 1200 caracteres."),
  animalCapacity: z.number().int().min(0).optional(),
  city: z.string().min(2, "Cidade obrigatória."),
  state: z.string().length(2, "UF obrigatória."),
  address: z.string().optional(),
  profileDetails: profileDetailsSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: ONG_LEGAL_ACCEPTANCE_MESSAGE }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: ONG_LEGAL_ACCEPTANCE_MESSAGE }) }),
  providedDocumentTypes: z.array(z.string()).optional(),
  verificationDocuments: z.array(verificationDocumentSchema).optional(),
});

export const ongIndividualRegisterSchema = ongBaseSchema.extend({
  ongType: z.literal("INDIVIDUAL"),
  activityStartDate: z.string().min(1, "Data de início das atividades obrigatória."),
});

export const ongInstitutionRegisterSchema = ongBaseSchema.extend({
  ongType: z.literal("INSTITUTION"),
  cnpj: ongCnpjSchema,
  ongName: z.string().min(2, "Nome da ONG obrigatório.").max(180),
  legalName: z.string().min(2, "Razão social obrigatória.").max(180),
  tradeName: z.string().max(180).optional(),
  foundedDate: z.string().min(1, "Data de fundação obrigatória."),
  focusArea: z.string().min(1, "Selecione a área de atuação."),
  representativeRole: z.string().min(1, "Informe o cargo do representante."),
});

export const ongRegisterUnionSchema = z.discriminatedUnion("ongType", [
  ongIndividualRegisterSchema,
  ongInstitutionRegisterSchema,
]);

function refineOngCommon(data: z.infer<typeof ongRegisterUnionSchema>, ctx: z.RefinementCtx) {
  if (data.actionTypes.includes("OUTROS") && (!data.actionTypesOther || data.actionTypesOther.trim().length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actionTypesOther"],
      message: "Descreva sua área de atuação.",
    });
  }

  if (data.ongType === "INDIVIDUAL") {
    const dateErr = validateActivityStartDate(data.activityStartDate);
    if (dateErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activityStartDate"], message: dateErr });
    }
  }

  const docCheck = validateRequiredOngDocuments(data.ongType, data.providedDocumentTypes ?? []);
  if (!docCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["providedDocumentTypes"],
      message: docCheck.message ?? "Documentos obrigatórios pendentes.",
    });
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: PASSWORD_MISMATCH_MESSAGE,
    });
    return;
  }

  const pwd = validateStrongPassword(data.password, {
    email: data.email,
    name: data.name,
    username: data.username,
    phone: data.phone,
  });
  if (!pwd.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: pwd.error ?? "Senha não atende aos requisitos de segurança.",
    });
  }
}

export const ongRegisterSchema = ongRegisterUnionSchema.superRefine(refineOngCommon);

export type OngRegisterInput = z.infer<typeof ongRegisterSchema>;

/** Cadastro legado CNPJ-only (compatibilidade testes antigos). */
export const ongLegacyRegisterSchema = z.object({
  role: z.literal(UserRole.ONG),
  name: z.string().min(2),
  email: emailSchema,
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
  phone: phoneSchema,
  ongName: z.string().min(2),
  cnpj: ongCnpjSchema,
  responsibleName: z.string().min(2),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().length(2).transform((v) => v.toUpperCase()),
});

export { ONG_LEGAL };
