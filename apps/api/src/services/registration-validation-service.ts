import { prisma } from "@ecopet/database";
import { onlyDigits, normalizePhone } from "../lib/documents.js";
import { AppError, USER_MESSAGES } from "../lib/app-errors.js";
import { createAuditLog } from "./audit-service.js";

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

export async function assertEmailAvailable(email: string, ctx?: { ip?: string; userAgent?: string }) {
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) {
    await logDuplicateAttempt({ field: "email", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.USER_ALREADY_REGISTERED, 409, "EMAIL_DUPLICATE");
  }
}

export async function assertPhoneAvailable(phone: string, ctx?: { ip?: string; userAgent?: string }) {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  const exists = users.some((u) => u.phone && normalizePhone(u.phone) === normalized);
  if (exists) {
    await logDuplicateAttempt({ field: "phone", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.PHONE_DUPLICATE, 409, "PHONE_DUPLICATE");
  }
}

export async function assertCpfAvailable(cpf: string, ctx?: { ip?: string; userAgent?: string; message?: string }) {
  const doc = onlyDigits(cpf);
  const [user, ong, sp] = await Promise.all([
    prisma.user.findUnique({ where: { cpf: doc } }),
    prisma.ongProfile.findFirst({ where: { cnpj: doc, documentType: "CPF" } }),
    prisma.serviceProviderProfile.findFirst({ where: { documentNumber: doc, documentType: "CPF" } }),
  ]);
  if (user || ong || sp) {
    await logDuplicateAttempt({ field: "cpf", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.USER_ALREADY_REGISTERED, 409, "CPF_DUPLICATE");
  }
}

export async function assertCnpjAvailable(cnpj: string, ctx?: { ip?: string; userAgent?: string; message?: string }) {
  const doc = onlyDigits(cnpj);
  const [clinic, petshop, seller, ong, sp] = await Promise.all([
    prisma.clinicProfile.findUnique({ where: { cnpj: doc } }),
    prisma.petshopProfile.findUnique({ where: { cnpj: doc } }),
    prisma.sellerProfile.findUnique({ where: { cnpj: doc } }),
    prisma.ongProfile.findFirst({ where: { cnpj: doc, documentType: "CNPJ" } }),
    prisma.serviceProviderProfile.findFirst({ where: { documentNumber: doc, documentType: "CNPJ" } }),
  ]);
  if (clinic || petshop || seller || ong || sp) {
    await logDuplicateAttempt({ field: "cnpj", ip: ctx?.ip, userAgent: ctx?.userAgent });
    throw new AppError(USER_MESSAGES.USER_ALREADY_REGISTERED, 409, "CNPJ_DUPLICATE");
  }
}

export async function assertDocumentAvailable(
  documentType: "CPF" | "CNPJ",
  documentNumber: string,
  ctx?: { ip?: string; userAgent?: string }
) {
  if (documentType === "CPF") {
    await assertCpfAvailable(documentNumber, { ...ctx, message: USER_MESSAGES.DOCUMENT_DUPLICATE });
  } else {
    await assertCnpjAvailable(documentNumber, { ...ctx, message: USER_MESSAGES.DOCUMENT_DUPLICATE });
  }
}
