import { prisma } from "@ecopet/database";
import {
  onlyDigits,
  normalizePhone,
  isValidCpfFormat,
  isValidCnpjFormat,
} from "../lib/documents.js";
import { AppError, USER_MESSAGES } from "../lib/app-errors.js";
import { createAuditLog } from "./audit-service.js";

const isDev = process.env.NODE_ENV !== "production";

function devRegisterLog(event: string, data: Record<string, unknown>) {
  if (!isDev) return;
  console.log(`[register:${event}]`, JSON.stringify(data));
}

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeRegistrationCpf(cpf: string): string {
  return onlyDigits(cpf);
}

export function normalizeRegistrationCnpj(cnpj: string): string {
  return onlyDigits(cnpj);
}

export function normalizeRegistrationPhone(phone: string): string {
  return normalizePhone(phone);
}

export type DuplicateCheckField = "email" | "cpf" | "cnpj" | "phone";

export function buildDuplicateConditions(input: {
  email?: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
}): { field: DuplicateCheckField; value: string }[] {
  const conditions: { field: DuplicateCheckField; value: string }[] = [];

  const email = normalizeRegistrationEmail(input.email ?? "");
  if (email) conditions.push({ field: "email", value: email });

  const cpf = normalizeRegistrationCpf(input.cpf ?? "");
  if (isValidCpfFormat(cpf)) conditions.push({ field: "cpf", value: cpf });

  const cnpj = normalizeRegistrationCnpj(input.cnpj ?? "");
  if (isValidCnpjFormat(cnpj)) conditions.push({ field: "cnpj", value: cnpj });

  const phone = normalizeRegistrationPhone(input.phone ?? "");
  if (phone.length >= 10 && phone.length <= 11) conditions.push({ field: "phone", value: phone });

  return conditions;
}

async function logDuplicateAttempt(params: {
  field: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  await createAuditLog({
    action: "CREATE",
    module: "auth",
    resource: "registration_duplicate",
    metadata: { field: params.field, ...params.metadata },
    ip: params.ip,
    userAgent: params.userAgent,
  });
  await prisma.securityEvent.create({
    data: {
      eventType: "registration_duplicate",
      severity: "warning",
      metadata: { field: params.field, ...params.metadata },
      ip: params.ip,
    },
  });
}

async function logDuplicateConflict(details: {
  conflictField: string;
  email?: string;
  cpf?: string;
  phone?: string;
  role?: string;
  existingUser?: { id: string; email: string; cpf?: string | null; phone?: string | null; role?: string } | null;
  existingCpf?: { table: string; id: string; userId?: string; email?: string } | null;
  existingPhone?: { id: string; email: string; phone?: string | null } | null;
  existingCnpj?: { table: string; id: string } | null;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[register:409]", {
      conflictField: details.conflictField,
      email: details.email,
      cpf: details.cpf,
      phone: details.phone,
      role: details.role,
      existingUser: details.existingUser ?? null,
      existingCpf: details.existingCpf ?? null,
      existingPhone: details.existingPhone ?? null,
      existingCnpj: details.existingCnpj ?? null,
    });
  }
}

export async function assertEmailAvailable(
  email: string,
  ctx?: { ip?: string; userAgent?: string; role?: string }
) {
  const normalized = normalizeRegistrationEmail(email);
  if (!normalized) return;

  devRegisterLog("normalized", { email: normalized });

  const exists = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, cpf: true, phone: true, role: true },
  });
  if (exists) {
    await logDuplicateConflict({
      conflictField: "email",
      email: normalized,
      role: ctx?.role,
      existingUser: exists,
    });
    devRegisterLog("duplicateFound", { field: "email", userId: exists.id });
    await logDuplicateAttempt({
      field: "email",
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
      metadata: { existingUserId: exists.id, existingEmail: exists.email },
    });
    throw new AppError(USER_MESSAGES.EMAIL_DUPLICATE, 409, "EMAIL_DUPLICATE");
  }
}

export async function assertPhoneAvailable(
  phone: string,
  ctx?: { ip?: string; userAgent?: string; role?: string; email?: string }
) {
  const normalized = normalizeRegistrationPhone(phone);
  if (!normalized || normalized.length < 10 || normalized.length > 11) return;

  devRegisterLog("normalized", { phone: normalized });

  const direct = await prisma.user.findFirst({
    where: { phone: normalized },
    select: { id: true, email: true, phone: true, cpf: true, role: true },
  });
  if (direct) {
    await logDuplicateConflict({
      conflictField: "phone",
      email: ctx?.email,
      phone: normalized,
      role: ctx?.role,
      existingPhone: direct,
      existingUser: direct,
    });
    devRegisterLog("duplicateFound", { field: "phone", userId: direct.id });
    await logDuplicateAttempt({ field: "phone", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.PHONE_DUPLICATE, 409, "PHONE_DUPLICATE");
  }

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, phone: true, cpf: true, role: true },
  });
  const legacyMatch = users.find((u) => u.phone && normalizePhone(u.phone) === normalized);
  if (legacyMatch) {
    await logDuplicateConflict({
      conflictField: "phone",
      email: ctx?.email,
      phone: normalized,
      role: ctx?.role,
      existingPhone: legacyMatch,
      existingUser: legacyMatch,
    });
    devRegisterLog("duplicateFound", { field: "phone", userId: legacyMatch.id, legacy: true });
    await logDuplicateAttempt({ field: "phone", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.PHONE_DUPLICATE, 409, "PHONE_DUPLICATE");
  }
}

export async function assertCpfAvailable(
  cpf: string,
  ctx?: { ip?: string; userAgent?: string; role?: string; email?: string }
) {
  const doc = normalizeRegistrationCpf(cpf);
  if (!isValidCpfFormat(doc)) return;

  devRegisterLog("normalized", { cpf: doc });

  const [user, ong, sp] = await Promise.all([
    prisma.user.findUnique({
      where: { cpf: doc },
      select: { id: true, email: true, cpf: true, phone: true, role: true },
    }),
    prisma.ongProfile.findFirst({
      where: { cnpj: doc, documentType: "CPF" },
      select: { id: true, userId: true, user: { select: { email: true } } },
    }),
    prisma.serviceProviderProfile.findFirst({
      where: { documentNumber: doc, documentType: "CPF" },
      select: { id: true, userId: true, user: { select: { email: true } } },
    }),
  ]);

  const duplicateField = user ? "cpf:user" : ong ? "cpf:ong" : sp ? "cpf:serviceProvider" : null;
  if (duplicateField) {
    await logDuplicateConflict({
      conflictField: "cpf",
      email: ctx?.email,
      cpf: doc,
      role: ctx?.role,
      existingUser: user ?? null,
      existingCpf: user
        ? { table: "User", id: user.id, email: user.email }
        : ong
          ? { table: "OngProfile", id: ong.id, userId: ong.userId, email: ong.user.email }
          : sp
            ? { table: "ServiceProviderProfile", id: sp.id, userId: sp.userId, email: sp.user.email }
            : null,
    });
    devRegisterLog("duplicateFound", {
      field: "cpf",
      source: duplicateField,
      userId: user?.id,
      profileId: ong?.id ?? sp?.id,
    });
    await logDuplicateAttempt({ field: "cpf", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.CPF_DUPLICATE_SHORT, 409, "CPF_DUPLICATE");
  }
}

export async function assertCnpjAvailable(
  cnpj: string,
  ctx?: { ip?: string; userAgent?: string; role?: string; email?: string }
) {
  const doc = normalizeRegistrationCnpj(cnpj);
  if (!isValidCnpjFormat(doc)) return;

  devRegisterLog("normalized", { cnpj: doc });

  const [clinic, petshop, seller, ong, sp] = await Promise.all([
    prisma.clinicProfile.findUnique({ where: { cnpj: doc } }),
    prisma.petshopProfile.findUnique({ where: { cnpj: doc } }),
    prisma.sellerProfile.findUnique({ where: { cnpj: doc } }),
    prisma.ongProfile.findFirst({ where: { cnpj: doc, documentType: "CNPJ" } }),
    prisma.serviceProviderProfile.findFirst({ where: { documentNumber: doc, documentType: "CNPJ" } }),
  ]);

  const duplicateField = clinic
    ? "cnpj:clinic"
    : petshop
      ? "cnpj:petshop"
      : seller
        ? "cnpj:seller"
        : ong
          ? "cnpj:ong"
          : sp
            ? "cnpj:serviceProvider"
            : null;

  if (duplicateField) {
    await logDuplicateConflict({
      conflictField: "cnpj",
      email: ctx?.email,
      role: ctx?.role,
      existingCnpj: {
        table: duplicateField.replace("cnpj:", ""),
        id: clinic?.id ?? petshop?.id ?? seller?.id ?? ong?.id ?? sp?.id ?? "",
      },
    });
    devRegisterLog("duplicateFound", {
      field: "cnpj",
      source: duplicateField,
      profileId: clinic?.id ?? petshop?.id ?? seller?.id ?? ong?.id ?? sp?.id,
    });
    await logDuplicateAttempt({ field: "cnpj", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.CNPJ_DUPLICATE_SHORT, 409, "CNPJ_DUPLICATE");
  }
}

export async function assertDocumentAvailable(
  documentType: "CPF" | "CNPJ",
  documentNumber: string,
  ctx?: { ip?: string; userAgent?: string }
) {
  if (documentType === "CPF") {
    await assertCpfAvailable(documentNumber, ctx);
  } else {
    await assertCnpjAvailable(documentNumber, ctx);
  }
}

export function logRegisterPayload(payload: Record<string, unknown>) {
  const { password, passwordConfirm, ...safe } = payload;
  devRegisterLog("payload", safe);
}

export function logRegisterDuplicateConditions(conditions: ReturnType<typeof buildDuplicateConditions>) {
  devRegisterLog("duplicateConditions", { conditions });
}

export function logRegisterCreatedUser(user: { id: string; email: string; role: string }) {
  devRegisterLog("createdUser", user);
}
