import type { PrismaClient } from "@prisma/client";
import { normalizeRegistrationEmail } from "@/lib/validation/email";
import { onlyDigits } from "@/schemas/validation/documents-shared";

export type LoginIdentifierType = "email" | "username" | "document";

export function parseLoginIdentifier(raw: string): { type: LoginIdentifierType; value: string } {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: normalizeRegistrationEmail(trimmed) };
  }
  const digits = onlyDigits(trimmed);
  if (digits.length === 11 || digits.length === 14) {
    return { type: "document", value: digits };
  }
  return { type: "username", value: trimmed.toLowerCase().replace(/^@/, "") };
}

type LoginDb = Pick<PrismaClient, "user" | "partnerProfile" | "ongProfile">;

export async function findUserByLoginIdentifier(db: LoginDb, identifier: string) {
  const parsed = parseLoginIdentifier(identifier);
  if (parsed.type === "email") {
    return db.user.findUnique({ where: { email: parsed.value } });
  }
  if (parsed.type === "document") {
    if (parsed.value.length === 11) {
      return db.user.findFirst({ where: { cpf: parsed.value } });
    }
    const [byUser, partner, ong] = await Promise.all([
      db.user.findFirst({ where: { cnpj: parsed.value } }),
      db.partnerProfile.findFirst({ where: { cnpj: parsed.value }, select: { userId: true } }),
      db.ongProfile.findFirst({ where: { cnpj: parsed.value }, select: { userId: true } }),
    ]);
    if (byUser) return byUser;
    const userId = partner?.userId ?? ong?.userId;
    if (!userId) return null;
    return db.user.findUnique({ where: { id: userId } });
  }
  if (!parsed.value) return null;
  return db.user.findUnique({ where: { username: parsed.value } });
}
