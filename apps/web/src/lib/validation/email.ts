export const EMAIL_INVALID_MESSAGE = "Digite um e-mail válido.";
export const EMAIL_VALID_MESSAGE = "E-mail válido.";

/** local@dominio.tld — rejeita entradas incompletas (sofia, sofia@, sofia@gmail, sofia.com, @gmail.com). */
const REGISTRATION_EMAIL_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export function isValidRegistrationEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  if (!trimmed.includes("@")) return false;
  if (trimmed.startsWith("@")) return false;

  const atIndex = trimmed.indexOf("@");
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (!local || !domain) return false;
  if (!domain.includes(".")) return false;

  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  if (domainParts.some((part) => part.length === 0)) return false;

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  return REGISTRATION_EMAIL_PATTERN.test(trimmed);
}

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getEmailLiveFeedback(email: string): {
  valid: boolean;
  message?: string;
} {
  if (!email.trim()) return { valid: false };
  if (isValidRegistrationEmail(email)) {
    return { valid: true, message: EMAIL_VALID_MESSAGE };
  }
  return { valid: false, message: EMAIL_INVALID_MESSAGE };
}
