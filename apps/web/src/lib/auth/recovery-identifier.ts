import type { PrismaClient } from "@prisma/client";
import { normalizeRegistrationEmail } from "@/lib/validation/email";
import {
  normalizeInternationalPhone,
  sanitizePhoneInput,
} from "@/lib/validation/international-phone";
import { normalizeBrazilPhoneFromE164 } from "@/lib/validation/brazil-phone";
import { isSmsConfigured } from "@/lib/sms/provider";

export type RecoveryIdentifierType = "email" | "phone";

export function parseRecoveryIdentifier(raw: string): {
  type: RecoveryIdentifierType;
  value: string;
} {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: normalizeRegistrationEmail(trimmed) };
  }
  const sanitized = sanitizePhoneInput(trimmed);
  if (sanitized.startsWith("+55")) {
    const e164 = normalizeBrazilPhoneFromE164(sanitized);
    if (e164) return { type: "phone", value: e164 };
  }
  const digits = sanitized.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    const e164 = normalizeBrazilPhoneFromE164(`+${digits}`);
    if (e164) return { type: "phone", value: e164 };
  }
  const e164 = normalizeInternationalPhone(sanitized, "BR");
  if (e164) return { type: "phone", value: e164 };
  return { type: "phone", value: sanitized };
}

export async function findUserByRecoveryIdentifier(
  db: Pick<PrismaClient, "user">,
  identifier: string
) {
  const parsed = parseRecoveryIdentifier(identifier);
  if (parsed.type === "email") {
    return db.user.findUnique({ where: { email: parsed.value } });
  }

  const phone = parsed.value;
  if (!phone) return null;

  return db.user.findFirst({ where: { phone } });
}

export function isPhoneSmsRecoveryEnabled(): boolean {
  if (process.env.PHONE_SMS_RECOVERY_ENABLED === "0") return false;
  if (process.env.PHONE_SMS_RECOVERY_ENABLED === "1") return true;
  if (isSmsConfigured()) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}
