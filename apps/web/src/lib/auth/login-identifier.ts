import type { PrismaClient } from "@prisma/client";
import { normalizeRegistrationEmail } from "@/lib/validation/email";

export type LoginIdentifierType = "email" | "username";

export function parseLoginIdentifier(raw: string): { type: LoginIdentifierType; value: string } {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: normalizeRegistrationEmail(trimmed) };
  }
  return { type: "username", value: trimmed.toLowerCase().replace(/^@/, "") };
}

export async function findUserByLoginIdentifier(
  db: Pick<PrismaClient, "user">,
  identifier: string
) {
  const parsed = parseLoginIdentifier(identifier);
  if (parsed.type === "email") {
    return db.user.findUnique({ where: { email: parsed.value } });
  }
  if (!parsed.value) return null;
  return db.user.findUnique({ where: { username: parsed.value } });
}
