import { z } from "zod";
import { UserRole } from "@prisma/client";

const cpfRegex = /^\d{11}$/;
const cnpjRegex = /^\d{14}$/;
const phoneRegex = /^[\d\s()+-]{10,20}$/;

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => cpfRegex.test(v), "CPF inválido");

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => cnpjRegex.test(v), "CNPJ inválido");

export const phoneSchema = z
  .string()
  .min(10, "Telefone obrigatório")
  .refine((v) => phoneRegex.test(v), "Telefone inválido");

export const addressSchema = z.object({
  street: z.string().min(3, "Endereço obrigatório"),
  number: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida"),
  zipCode: z.string().optional(),
});

export const documentsSchema = z
  .array(
    z.object({
      name: z.string(),
      size: z.number().optional(),
      type: z.string().optional(),
    })
  )
  .optional();

const baseRegisterObject = z.object({
  role: z.nativeEnum(UserRole),
  email: z.string().email("E-mail inválido"),
  username: z
    .string()
    .min(3, "Usuário deve ter no mínimo 3 caracteres")
    .max(30)
    .regex(/^[a-z0-9._-]+$/i, "Usuário inválido")
    .optional(),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  passwordConfirm: z.string().optional(),
  phone: phoneSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Aceite os termos de uso" }) }),
  acceptLgpd: z.literal(true, { errorMap: () => ({ message: "Aceite a política LGPD" }) }),
  address: addressSchema.optional(),
  documents: documentsSchema,
});

function passwordConfirmRefine(data: { password: string; passwordConfirm?: string }, ctx: z.RefinementCtx) {
  if (data.passwordConfirm && data.password !== data.passwordConfirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senhas não conferem", path: ["passwordConfirm"] });
  }
}

export const baseRegisterSchema = baseRegisterObject.superRefine(passwordConfirmRefine);

export const tutorRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.TUTOR),
  name: z.string().min(2, "Nome completo obrigatório"),
  cpf: cpfSchema,
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  address: addressSchema,
  petCount: z.coerce.number().int().min(0).optional(),
  primaryInterests: z.array(z.string()).min(1, "Selecione ao menos um interesse"),
}).superRefine(passwordConfirmRefine);

export const veterinarianRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.VETERINARIAN),
  name: z.string().min(2, "Nome completo obrigatório"),
  cpf: cpfSchema,
  crmv: z.string().min(4, "CRMV obrigatório"),
  crmvState: z.string().length(2, "UF do CRMV obrigatória"),
  specialty: z.string().min(2, "Especialidade obrigatória"),
  professionalAddress: z.string().min(3, "Endereço profissional obrigatório"),
  inPersonAvailable: z.boolean(),
  onlineAvailable: z.boolean(),
  averageConsultationPrice: z.coerce.number().positive("Valor da consulta inválido").optional(),
}).superRefine(passwordConfirmRefine);

export const clinicRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.CLINIC),
  name: z.string().min(2, "Razão social obrigatória"),
  tradeName: z.string().min(2, "Nome fantasia obrigatório"),
  cnpj: cnpjSchema,
  technicalResponsible: z.string().min(2, "Responsável técnico obrigatório"),
  responsibleCrmv: z.string().min(4, "CRMV do responsável obrigatório"),
  address: addressSchema,
  hours: z.string().min(2, "Horário de funcionamento obrigatório"),
  services: z.array(z.string()).min(1, "Informe ao menos um serviço"),
  emergency: z.boolean(),
}).superRefine(passwordConfirmRefine);

export const petshopRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.PETSHOP),
  username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/i),
  name: z.string().min(2, "Razão social obrigatória"),
  tradeName: z.string().min(2, "Nome fantasia obrigatório"),
  cnpj: cnpjSchema,
  responsible: z.string().min(2, "Responsável obrigatório"),
  address: addressSchema,
  sellsProducts: z.boolean(),
  offersServices: z.boolean(),
  categories: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  hours: z.string().min(2, "Horário de funcionamento obrigatório"),
}).superRefine(passwordConfirmRefine);

export const sellerRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.SELLER),
  name: z.string().min(2, "Razão social obrigatória"),
  tradeName: z.string().min(2, "Nome fantasia obrigatório"),
  cnpj: cnpjSchema,
  responsible: z.string().min(2, "Responsável obrigatório"),
  address: addressSchema,
  productCategories: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  deliveryPolicy: z.string().min(5, "Política de entrega obrigatória"),
  exchangePolicy: z.string().min(5, "Política de troca obrigatória"),
  bankData: z.object({
    pixKey: z.string().min(3, "Chave Pix obrigatória"),
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
  }),
}).superRefine(passwordConfirmRefine);

export const serviceProviderRegisterSchema = baseRegisterObject
  .extend({
    role: z.literal(UserRole.SERVICE_PROVIDER),
    name: z.string().min(2, "Nome ou razão social obrigatório"),
    documentType: z.enum(["CPF", "CNPJ"]),
    documentNumber: z.string().min(11, "Documento inválido"),
    serviceTypes: z.array(z.string()).min(1, "Selecione ao menos um tipo de serviço"),
    serviceArea: z.string().min(2, "Área de atendimento obrigatória"),
    homeService: z.boolean(),
    startingPrice: z.coerce.number().positive().optional(),
    availability: z.string().min(2, "Disponibilidade obrigatória"),
  })
  .superRefine((data, ctx) => {
    passwordConfirmRefine(data, ctx);
    const doc = data.documentNumber.replace(/\D/g, "");
    if (data.documentType === "CPF" && !cpfRegex.test(doc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF inválido", path: ["documentNumber"] });
    }
    if (data.documentType === "CNPJ" && !cnpjRegex.test(doc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CNPJ inválido", path: ["documentNumber"] });
    }
  });

export const ongRegisterSchema = baseRegisterObject
  .extend({
    role: z.literal(UserRole.ONG),
    username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/i),
    name: z.string().min(2, "Nome da ONG ou protetor obrigatório"),
    documentType: z.enum(["CPF", "CNPJ"]),
    documentNumber: z.string().min(11, "CPF ou CNPJ inválido"),
    responsible: z.string().min(2, "Responsável obrigatório"),
    address: addressSchema,
    actionTypes: z.array(z.string()).min(1, "Selecione ao menos um tipo de atuação"),
    animalCapacity: z.coerce.number().int().min(0).optional(),
    acceptsDonations: z.boolean(),
  })
  .superRefine((data, ctx) => {
    passwordConfirmRefine(data, ctx);
    const doc = data.documentNumber.replace(/\D/g, "");
    if (data.documentType === "CPF" && !cpfRegex.test(doc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF inválido", path: ["documentNumber"] });
    }
    if (data.documentType === "CNPJ" && !cnpjRegex.test(doc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CNPJ inválido", path: ["documentNumber"] });
    }
  });

export const adminRegisterSchema = baseRegisterObject.extend({
  role: z.literal(UserRole.ADMIN),
  name: z.string().min(2, "Nome completo obrigatório"),
  cpf: cpfSchema,
  corporateEmail: z.string().email("E-mail corporativo inválido"),
  jobTitle: z.string().min(2, "Cargo obrigatório"),
  accessLevel: z.enum(["suporte", "financeiro", "comercial", "moderacao", "administrador_geral"]),
}).superRefine(passwordConfirmRefine);

export const registerSchema = z.union([
  tutorRegisterSchema,
  veterinarianRegisterSchema,
  clinicRegisterSchema,
  petshopRegisterSchema,
  sellerRegisterSchema,
  serviceProviderRegisterSchema,
  ongRegisterSchema,
  adminRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;

export const REGISTRATION_ROLES = [
  UserRole.TUTOR,
  UserRole.VETERINARIAN,
  UserRole.CLINIC,
  UserRole.PETSHOP,
  UserRole.SELLER,
  UserRole.SERVICE_PROVIDER,
  UserRole.ONG,
  UserRole.ADMIN,
] as const;

export const ROLE_REDIRECTS: Record<(typeof REGISTRATION_ROLES)[number], string> = {
  [UserRole.TUTOR]: "/onboarding/pet",
  [UserRole.VETERINARIAN]: "/dashboard/veterinario",
  [UserRole.CLINIC]: "/dashboard/clinica",
  [UserRole.PETSHOP]: "/dashboard/petshop",
  [UserRole.SELLER]: "/dashboard/seller",
  [UserRole.SERVICE_PROVIDER]: "/dashboard/prestador",
  [UserRole.ONG]: "/dashboard/ong",
  [UserRole.ADMIN]: "/gestor",
};

export const PENDING_APPROVAL_ROLES: UserRole[] = [
  UserRole.VETERINARIAN,
  UserRole.CLINIC,
  UserRole.PETSHOP,
  UserRole.SELLER,
  UserRole.SERVICE_PROVIDER,
  UserRole.ONG,
];
