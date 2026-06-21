import { z } from "zod";
import { UserRole } from "@prisma/client";
import {
  emailSchema,
  fullNameSchema,
  usernameSchema,
  phoneSchema,
  cpfSchema,
} from "@/schemas/auth";
import { PASSWORD_MISMATCH_MESSAGE, validateStrongPassword } from "@/lib/password/validate-strong-password";
import { validateActivityStartDate } from "@/lib/validation/activity-start-date";
import { onlyDigits, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import { PARTNER_LEGAL_ACCEPTANCE_MESSAGE } from "@/lib/legal/legal-links";
import { validateOperationSchedule } from "@/lib/partner/operation-rules";
import { validateRequiredDocuments } from "@/lib/partner/document-validation";

export const CPF_INVALID_MESSAGE = "Digite um CPF válido.";
export const CNPJ_INVALID_MESSAGE = "Digite um CNPJ válido.";

export const partnerCnpjSchema = z
  .string()
  .min(1, CNPJ_INVALID_MESSAGE)
  .transform(onlyDigits)
  .refine((v) => v.length === 14, CNPJ_INVALID_MESSAGE)
  .refine((v) => !/^(\d)\1+$/.test(v), CNPJ_INVALID_MESSAGE)
  .refine(validateCnpjChecksum, CNPJ_INVALID_MESSAGE);

export const partnerCpfSchema = cpfSchema;

const addressDetailsSchema = z.object({
  zipCode: z.string().min(8, "Digite um CEP válido."),
  streetType: z.string().min(1, "Selecione o tipo de logradouro."),
  streetTypeOther: z.string().optional(),
  street: z.string().min(1, "Logradouro obrigatório."),
  number: z.string().min(1, "Número obrigatório."),
  district: z.string().min(1, "Bairro obrigatório."),
  city: z.string().min(2, "Cidade obrigatória."),
  state: z.string().length(2, "UF obrigatória."),
  complement: z.string().optional(),
  reference: z.string().optional(),
});

const operationDetailsSchema = z.object({
  modes: z.array(z.string()).min(1, "Selecione ao menos uma forma de funcionamento."),
  weekdays: z.array(z.string()).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  serviceRadius: z.string().min(1, "Selecione o raio de atendimento."),
  deliveryOptions: z.array(z.string()).optional(),
  logisticsNotes: z.string().optional(),
  socialLinks: z
    .object({
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      googleBusiness: z.string().optional(),
      whatsapp: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

const financialDetailsSchema = z.object({
  paymentMethods: z.array(z.string()).min(1, "Selecione ao menos uma forma de pagamento."),
  pixKeyType: z.string().optional(),
  pixKey: z.string().optional(),
  bankName: z.string().optional(),
  bankNameOther: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  accountDigit: z.string().optional(),
  accountType: z.string().optional(),
  accountHolder: z.string().optional(),
  accountHolderDocument: z.string().optional(),
});

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

const partnerExtrasSchema = {
  logoUrl: z.string().url().optional(),
  logoAlt: z.string().max(200).optional(),
  verificationDocuments: z.array(verificationDocumentSchema).optional(),
  providedDocumentTypes: z.array(z.string()).optional(),
  cnpjDetails: z.record(z.unknown()).optional(),
};

const partnerBaseSchema = z.object({
  role: z.literal(UserRole.PARTNER),
  partnerType: z.enum(["AUTONOMOUS", "CORPORATE"]),
  name: fullNameSchema,
  email: emailSchema,
  password: z.string().min(1, "Senha obrigatória"),
  confirmPassword: z.string().min(1, "Confirmar senha é obrigatório"),
  phone: phoneSchema,
  username: usernameSchema,
  activityStartDate: z.string().min(1, "Data de início das atividades obrigatória."),
  activityAreas: z.array(z.string()).min(1, "Selecione ao menos uma área de atuação."),
  activityAreasOther: z.string().optional(),
  businessDescription: z
    .string()
    .min(80, "Descreva melhor sua atuação profissional.")
    .max(800, "A descrição deve ter no máximo 800 caracteres."),
  addressDetails: addressDetailsSchema,
  operationDetails: operationDetailsSchema,
  financialDetails: financialDetailsSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: PARTNER_LEGAL_ACCEPTANCE_MESSAGE }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: PARTNER_LEGAL_ACCEPTANCE_MESSAGE }) }),
  ...partnerExtrasSchema,
});

export const partnerAutonomousRegisterSchema = partnerBaseSchema.extend({
  partnerType: z.literal("AUTONOMOUS"),
  cpf: partnerCpfSchema,
  professionalName: z.string().min(2, "Nome comercial obrigatório.").max(120),
});

export const partnerCorporateRegisterSchema = partnerBaseSchema.extend({
  partnerType: z.literal("CORPORATE"),
  cnpj: partnerCnpjSchema,
  businessName: z.string().min(2, "Nome comercial obrigatório.").max(120),
  legalName: z.string().min(2, "Razão social obrigatória.").max(180),
  corporateType: z.string().min(1, "Selecione o tipo corporativo."),
  corporateTypeOther: z.string().optional(),
});

export const partnerRegisterUnionSchema = z.discriminatedUnion("partnerType", [
  partnerAutonomousRegisterSchema,
  partnerCorporateRegisterSchema,
]);

function refinePartnerCommon(data: z.infer<typeof partnerRegisterUnionSchema>, ctx: z.RefinementCtx) {
  const activityDateError = validateActivityStartDate(data.activityStartDate);
  if (activityDateError) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activityStartDate"], message: activityDateError });
  }

  if (data.activityAreas.includes("OUTROS") && (!data.activityAreasOther || data.activityAreasOther.trim().length < 3)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["activityAreasOther"],
      message: "Descreva sua área de atuação.",
    });
  }

  const addr = data.addressDetails;
  if (addr.streetType === "Outro" && (!addr.streetTypeOther || addr.streetTypeOther.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["addressDetails", "streetTypeOther"],
      message: "Informe o tipo de logradouro.",
    });
  }

  const op = data.operationDetails;
  const scheduleErr = validateOperationSchedule(
    op.modes,
    op.weekdays ?? [],
    op.openTime ?? "",
    op.closeTime ?? ""
  );
  if (scheduleErr) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["operationDetails", scheduleErr.field ?? "openTime"],
      message: scheduleErr.message,
    });
  }

  const docCheck = validateRequiredDocuments(
    data.partnerType,
    data.providedDocumentTypes ?? []
  );
  if (!docCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["providedDocumentTypes"],
      message: docCheck.message ?? "Documentos obrigatórios pendentes.",
    });
  }

  const fin = data.financialDetails;
  if (fin.paymentMethods.includes("Pix")) {
    if (!fin.pixKeyType || !fin.pixKey?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financialDetails", "pixKey"],
        message: "Informe a chave Pix.",
      });
    }
  }
  if (fin.paymentMethods.includes("Transferência bancária")) {
    if (!fin.bankName || !fin.agency || !fin.accountNumber || !fin.accountHolder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financialDetails", "bankName"],
        message: "Preencha os dados bancários.",
      });
    }
    if (fin.bankName === "Outros" && !fin.bankNameOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financialDetails", "bankNameOther"],
        message: "Informe o banco.",
      });
    }
  }

  if (data.partnerType === "CORPORATE" && data.corporateType === "Outro") {
    if (!data.corporateTypeOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["corporateTypeOther"],
        message: "Informe o tipo corporativo.",
      });
    }
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

export const partnerRegisterSchema = partnerRegisterUnionSchema.superRefine(refinePartnerCommon);

export type PartnerRegisterInput = z.infer<typeof partnerRegisterSchema>;

/** Compatibilidade com payload legado (cadastro corporativo simplificado). */
export const partnerLegacyRegisterSchema = z
  .object({
    role: z.literal(UserRole.PARTNER),
    partnerType: z.literal("CORPORATE").optional(),
    name: z.string().min(2),
    email: emailSchema,
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
    phone: phoneSchema,
    businessName: z.string().min(2),
    legalName: z.string().min(2),
    cnpj: partnerCnpjSchema,
    category: z.string().min(2),
    address: z.string().min(3),
    city: z.string().min(2),
    state: z.string().length(2).transform((v) => v.toUpperCase()),
    username: usernameSchema.optional(),
    acceptTerms: z.literal(true).optional(),
    acceptPrivacy: z.literal(true).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: PASSWORD_MISMATCH_MESSAGE });
    }
  });

export function composePartnerAddressLine(details: z.infer<typeof addressDetailsSchema>): string {
  const typeLabel =
    details.streetType === "Outro" ? details.streetTypeOther?.trim() || "Outro" : details.streetType;
  const parts = [typeLabel, details.street, details.number].filter(Boolean);
  if (details.complement?.trim()) parts.push(details.complement.trim());
  return parts.join(", ");
}

export function composePartnerCategory(areas: string[], other?: string): string {
  const labels = areas.map((a) => (a === "OUTROS" && other?.trim() ? `Outros: ${other.trim()}` : a));
  return labels.join(", ");
}
