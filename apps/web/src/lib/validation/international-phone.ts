import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  getCountries,
  type CountryCode,
} from "libphonenumber-js";
import {
  BR_DDD_REQUIRED_MESSAGE,
  BR_PHONE_INVALID_MESSAGE,
  BR_PHONE_VALID_MESSAGE,
  isValidBrazilNationalNumber,
  isValidBrazilPhoneE164,
  normalizeBrazilPhoneE164,
  normalizeBrazilPhoneFromE164,
} from "@/lib/validation/brazil-phone";

export type { CountryCode };

export const PHONE_INVALID_MESSAGE = "Digite um telefone válido.";
export const PHONE_VALID_MESSAGE = "Telefone válido.";
export const PHONE_REQUIRED_MESSAGE = "Telefone obrigatório";

export { BR_DDD_REQUIRED_MESSAGE, BR_PHONE_INVALID_MESSAGE, BR_PHONE_VALID_MESSAGE };

const ABSURD_SEQUENCES = /^(\d)\1{7,}$/;

/** Permite +, dígitos, espaços, parênteses e hífen; remove demais caracteres. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\s().-]/g, "");
}

export type PhoneValidationOptions = {
  country?: CountryCode;
  brazilDdd?: string;
};

function isBrazilContext(country: CountryCode, value: string): boolean {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return digits.startsWith("55");
  }
  return country === "BR";
}

export function isValidInternationalPhone(
  value: string,
  defaultCountry: CountryCode = "BR",
  options: PhoneValidationOptions = {}
): boolean {
  const country = options.country ?? defaultCountry;
  const sanitized = sanitizePhoneInput(value).trim();
  if (!sanitized || /[a-zA-Z]/.test(sanitized)) return false;

  if (isBrazilContext(country, sanitized)) {
    if (country === "BR" && options.brazilDdd !== undefined) {
      if (!options.brazilDdd) return false;
      return isValidBrazilNationalNumber(options.brazilDdd, sanitized);
    }
    if (sanitized.startsWith("+55")) return isValidBrazilPhoneE164(sanitized);
    const digits = sanitized.replace(/\D/g, "");
    if (digits.startsWith("55")) return isValidBrazilPhoneE164(`+${digits}`);
    if (options.brazilDdd) return isValidBrazilNationalNumber(options.brazilDdd, sanitized);
    return false;
  }

  const digitsOnly = sanitized.replace(/\D/g, "");
  if (digitsOnly.length < 7) return false;
  if (ABSURD_SEQUENCES.test(digitsOnly)) return false;

  try {
    return isValidPhoneNumber(sanitized, country);
  } catch {
    return false;
  }
}

export function normalizeInternationalPhone(
  value: string,
  defaultCountry: CountryCode = "BR",
  options: PhoneValidationOptions = {}
): string | null {
  const country = options.country ?? defaultCountry;
  const sanitized = sanitizePhoneInput(value).trim();
  if (!sanitized || /[a-zA-Z]/.test(sanitized)) return null;

  if (isBrazilContext(country, sanitized)) {
    if (country === "BR" && options.brazilDdd) {
      return normalizeBrazilPhoneE164(options.brazilDdd, sanitized);
    }
    if (sanitized.startsWith("+55")) {
      return normalizeBrazilPhoneFromE164(sanitized);
    }
    const digits = sanitized.replace(/\D/g, "");
    if (digits.startsWith("55")) {
      return normalizeBrazilPhoneFromE164(`+${digits}`);
    }
    return null;
  }

  try {
    const parsed = parsePhoneNumberFromString(sanitized, country);
    if (!parsed?.isValid()) return null;
    return parsed.format("E.164");
  } catch {
    return null;
  }
}

export function formatPhoneForDisplay(
  value: string,
  defaultCountry: CountryCode = "BR",
  options: PhoneValidationOptions = {}
): string {
  const sanitized = sanitizePhoneInput(value).trim();
  if (!sanitized) return "";

  if (isBrazilContext(options.country ?? defaultCountry, sanitized)) {
    const e164 = normalizeInternationalPhone(sanitized, defaultCountry, options);
    if (!e164) return sanitized;
    try {
      const parsed = parsePhoneNumberFromString(e164);
      if (parsed?.isValid()) return parsed.formatInternational();
    } catch {
      return e164;
    }
  }

  try {
    const parsed = parsePhoneNumberFromString(sanitized, defaultCountry);
    if (parsed?.isValid()) return parsed.formatInternational();
  } catch {
    // fallback abaixo
  }
  return sanitized;
}

export function getPhoneLiveFeedback(
  value: string,
  defaultCountry: CountryCode = "BR",
  brazilDdd?: string
): { valid: boolean; message?: string } {
  const sanitized = sanitizePhoneInput(value).trim();
  const country = defaultCountry;

  if (country === "BR") {
    if (!brazilDdd) {
      if (!sanitized) return { valid: false };
      return { valid: false, message: BR_DDD_REQUIRED_MESSAGE };
    }
    if (!sanitized) return { valid: false };
    if (isValidBrazilNationalNumber(brazilDdd, sanitized)) {
      return { valid: true, message: BR_PHONE_VALID_MESSAGE };
    }
    return { valid: false, message: BR_PHONE_INVALID_MESSAGE };
  }

  if (!sanitized) return { valid: false };

  if (isValidInternationalPhone(sanitized, country)) {
    return { valid: true, message: PHONE_VALID_MESSAGE };
  }

  return { valid: false, message: PHONE_INVALID_MESSAGE };
}

/** Países suportados pela libphonenumber-js (ISO 3166-1 alpha-2). */
export function getSupportedCountryCodes(): CountryCode[] {
  return getCountries();
}

export const PHONE_EXAMPLES = [
  "+55 83 99938-2221",
  "+55 11 3333-4444",
  "+1 202 555 0182",
  "+351 912 345 678",
  "+44 7911 123456",
] as const;

export function resolveRegistrationPhoneE164(
  value: string,
  country: CountryCode,
  brazilDdd?: string
): string | null {
  if (country === "BR") {
    if (!brazilDdd?.trim()) return null;
    return normalizeBrazilPhoneE164(brazilDdd, value);
  }
  return normalizeInternationalPhone(value, country);
}

export function isValidRegistrationPhone(
  value: string,
  country: CountryCode = "BR",
  brazilDdd?: string
): boolean {
  const sanitized = sanitizePhoneInput(value).trim();
  if (!sanitized) return false;

  if (sanitized.startsWith("+55") || sanitized.replace(/\D/g, "").startsWith("55")) {
    const e164 = sanitized.startsWith("+")
      ? normalizeBrazilPhoneFromE164(sanitized)
      : normalizeBrazilPhoneFromE164(`+${sanitized.replace(/\D/g, "")}`);
    return e164 !== null;
  }

  if (country === "BR") {
    if (!brazilDdd) return false;
    return isValidBrazilNationalNumber(brazilDdd, sanitized);
  }

  return isValidInternationalPhone(sanitized, country);
}
