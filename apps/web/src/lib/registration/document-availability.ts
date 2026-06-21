import { prisma } from "@/lib/prisma";
import { onlyDigits, validateCpfChecksum, validateCnpjChecksum } from "@/schemas/validation/documents-shared";

export { CPF_DUPLICATE_MESSAGE, CNPJ_DUPLICATE_MESSAGE } from "./document-messages";

export type DocumentKind = "cpf" | "cnpj";

export function normalizeDocumentDigits(type: DocumentKind, value: string): string {
  return onlyDigits(value);
}

export function isValidDocumentFormat(type: DocumentKind, digits: string): boolean {
  if (type === "cpf") {
    return digits.length === 11 && validateCpfChecksum(digits);
  }
  return digits.length === 14 && validateCnpjChecksum(digits);
}

/**
 * Verifica disponibilidade global de CPF em CLIENT, PARTNER, ONG e perfis legados.
 */
export async function isCpfGloballyAvailable(
  cpf: string,
  options?: { excludeUserId?: string }
): Promise<boolean> {
  const doc = normalizeDocumentDigits("cpf", cpf);
  if (!isValidDocumentFormat("cpf", doc)) return true;

  const [user, ongCpf, serviceProvider] = await Promise.all([
    prisma.user.findUnique({ where: { cpf: doc }, select: { id: true } }),
    prisma.ongProfile.findFirst({
      where: { cnpj: doc, documentType: "CPF" },
      select: { id: true },
    }),
    prisma.serviceProviderProfile.findFirst({
      where: { documentNumber: doc, documentType: "CPF" },
      select: { id: true },
    }),
  ]);

  if (user && user.id !== options?.excludeUserId) return false;
  if (ongCpf) return false;
  if (serviceProvider) return false;
  return true;
}

/**
 * Verifica disponibilidade global de CNPJ em CLIENT, PARTNER, ONG e perfis legados.
 */
export async function isCnpjGloballyAvailable(
  cnpj: string,
  options?: { excludeUserId?: string }
): Promise<boolean> {
  const doc = normalizeDocumentDigits("cnpj", cnpj);
  if (!isValidDocumentFormat("cnpj", doc)) return true;

  const [user, partner, ong, clinic, petshop, seller, serviceProvider] = await Promise.all([
    prisma.user.findFirst({ where: { cnpj: doc }, select: { id: true } }),
    prisma.partnerProfile.findUnique({ where: { cnpj: doc }, select: { id: true } }),
    prisma.ongProfile.findUnique({ where: { cnpj: doc }, select: { id: true } }),
    prisma.clinicProfile.findUnique({ where: { cnpj: doc }, select: { id: true } }),
    prisma.petshopProfile.findUnique({ where: { cnpj: doc }, select: { id: true } }),
    prisma.sellerProfile.findUnique({ where: { cnpj: doc }, select: { id: true } }),
    prisma.serviceProviderProfile.findFirst({
      where: { documentNumber: doc, documentType: "CNPJ" },
      select: { id: true },
    }),
  ]);

  if (user && user.id !== options?.excludeUserId) return false;
  if (partner || ong || clinic || petshop || seller || serviceProvider) return false;
  return true;
}

export async function isDocumentGloballyAvailable(
  type: DocumentKind,
  value: string,
  options?: { excludeUserId?: string }
): Promise<boolean> {
  return type === "cpf"
    ? isCpfGloballyAvailable(value, options)
    : isCnpjGloballyAvailable(value, options);
}
