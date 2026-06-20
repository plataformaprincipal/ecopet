import { onlyDigits } from "@/schemas/validation/documents-shared";
import { isValidRegistrationEmail, normalizeRegistrationEmail } from "@/lib/validation/email";

export type PasswordStrengthLevel = "very_weak" | "weak" | "medium" | "strong" | "excellent";

export type PasswordValidationContext = {
  email?: string;
  name?: string;
  username?: string;
  phone?: string;
  birthDate?: string;
};

export type PasswordRequirementCheck = {
  id: string;
  label: string;
  met: boolean;
  mandatory: boolean;
};

export type StrongPasswordResult = {
  valid: boolean;
  error?: string;
  level: PasswordStrengthLevel;
  levelLabel: string;
  requirements: PasswordRequirementCheck[];
};

export const PASSWORD_MISMATCH_MESSAGE = "As senhas não coincidem.";

const STRUCTURAL_REQUIREMENT_IDS = ["length", "uppercase", "lowercase", "number", "special", "no-space"] as const;
const PERSONAL_REQUIREMENT_IDS = ["no-email", "no-username", "no-name", "no-phone", "no-birthdate"] as const;

const ERROR_MESSAGES: Record<string, string> = {
  length: "A senha deve possuir no mínimo 8 caracteres.",
  uppercase: "A senha deve conter pelo menos uma letra maiúscula.",
  lowercase: "A senha deve possuir ao menos uma letra minúscula.",
  number: "A senha deve possuir ao menos um número.",
  special: "A senha deve possuir ao menos um caractere especial.",
  "no-space": "A senha não pode conter espaços.",
  "no-email": "A senha não pode conter seu e-mail.",
  "no-name": "A senha não pode conter seu nome.",
  "no-username": "A senha não pode conter seu nome de usuário.",
  "no-phone": "A senha não pode conter o telefone.",
  "no-birthdate": "A senha não pode conter a data de nascimento.",
};

const WEAK_PATTERNS = ["123456", "abcdef", "qwerty", "password", "senha", "ecopet"];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "");
}

function containsNormalized(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  if (n.length < 3) return false;
  return normalize(haystack).includes(n);
}

/** Parte local do e-mail (antes do @) com pelo menos 3 caracteres. */
function emailLocalPart(email: string): string {
  const normalized = normalizeRegistrationEmail(email);
  const at = normalized.indexOf("@");
  if (at <= 0) return "";
  return normalized.slice(0, at);
}

/** Domínio do e-mail (após o @), ex.: gmail.com */
function emailDomainPart(email: string): string {
  const normalized = normalizeRegistrationEmail(email);
  const at = normalized.indexOf("@");
  if (at < 0) return "";
  return normalized.slice(at + 1);
}

function passwordContainsFullEmail(password: string, email: string): boolean {
  const normalizedEmail = normalizeRegistrationEmail(email);
  return containsNormalized(password, normalizedEmail);
}

function passwordContainsEmailLocal(password: string, local: string): boolean {
  if (local.length < 3) return false;
  const normPwd = normalize(password);
  const normLocal = normalize(local);
  if (!normPwd.includes(normLocal)) return false;

  if (!password.includes("@")) {
    return true;
  }

  const beforeAt = normalize(password.split("@")[0] ?? "");
  const afterAt = password.split("@").slice(1).join("@");

  if (beforeAt === normLocal) {
    return true;
  }

  if (beforeAt !== normLocal && containsNormalized(beforeAt, local)) {
    return true;
  }

  if (containsNormalized(afterAt, local)) {
    return true;
  }

  return false;
}

function passwordContainsEmailDomain(password: string, domain: string): boolean {
  const normDomain = normalize(domain);
  if (normDomain.length < 4) return false;
  return normalize(password).includes(normDomain);
}

function passwordContainsEmail(password: string, email?: string): boolean {
  if (!email?.trim()) return false;
  if (!isValidRegistrationEmail(email)) return false;

  const local = emailLocalPart(email);
  const domain = emailDomainPart(email);

  return (
    passwordContainsFullEmail(password, email) ||
    passwordContainsEmailLocal(password, local) ||
    passwordContainsEmailDomain(password, domain)
  );
}

function passwordContainsName(password: string, name?: string): boolean {
  if (!name?.trim()) return false;
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter((p) => p.length >= 3);
  if (containsNormalized(password, trimmed)) return true;
  return parts.some((part) => containsNormalized(password, part));
}

function passwordContainsUsername(password: string, username?: string): boolean {
  if (!username?.trim()) return false;
  const u = username.trim().replace(/^@/, "");
  if (u.length < 3) return false;
  return containsNormalized(password, u);
}

function passwordContainsPhone(password: string, phone?: string): boolean {
  if (!phone?.trim()) return false;
  const digits = onlyDigits(phone);
  if (digits.length < 4) return false;
  if (containsNormalized(password, digits)) return true;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  return (
    (ddd.length >= 2 && containsNormalized(password, ddd)) ||
    (rest.length >= 4 && containsNormalized(password, rest))
  );
}

function passwordContainsBirthDate(password: string, birthDate?: string): boolean {
  if (!birthDate?.trim()) return false;
  const raw = birthDate.trim();
  const digits = onlyDigits(raw);
  if (digits.length >= 4 && containsNormalized(password, digits)) return true;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const variants = [`${d}${m}${y}`, `${d}/${m}/${y}`, `${m}${d}${y}`, y, `${d}${m}`, `${m}${y}`];
    return variants.some((v) => v.length >= 4 && containsNormalized(password, v));
  }
  return containsNormalized(password, raw);
}

function hasWeakPattern(password: string): boolean {
  const normalized = normalize(password);
  return WEAK_PATTERNS.some((p) => normalized.includes(p));
}

function charDiversityScore(password: string): number {
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function repetitionPenalty(password: string): number {
  if (/(.)\1{2,}/.test(password)) return 2;
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef/.test(password.toLowerCase())) return 1;
  return 0;
}

export function meetsMandatoryRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !/\s/.test(password)
  );
}

/** @deprecated Use meetsMandatoryRequirements */
export function meetsMediumRequirements(password: string): boolean {
  return meetsMandatoryRequirements(password);
}

function hasPersonalDataInPassword(password: string, context: PasswordValidationContext): boolean {
  return (
    passwordContainsEmail(password, context.email) ||
    passwordContainsName(password, context.name) ||
    passwordContainsUsername(password, context.username) ||
    passwordContainsPhone(password, context.phone) ||
    passwordContainsBirthDate(password, context.birthDate)
  );
}

function hasRepetitivePattern(password: string): boolean {
  return repetitionPenalty(password) > 0;
}

export function classifyPasswordLevel(
  password: string,
  context: PasswordValidationContext = {}
): {
  level: PasswordStrengthLevel;
  levelLabel: string;
} {
  if (password.length === 0) {
    return { level: "very_weak", levelLabel: "🔴 Muito Fraca" };
  }

  const mandatory = meetsMandatoryRequirements(password);
  const diversity = charDiversityScore(password);

  if (password.length < 4 || diversity <= 1) {
    return { level: "very_weak", levelLabel: "🔴 Muito Fraca" };
  }

  if (!mandatory) {
    const metCount = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    if (metCount <= 2 || password.length < 6) {
      return { level: "weak", levelLabel: "🟠 Fraca" };
    }
    return { level: "medium", levelLabel: "🟡 Média" };
  }

  const personal = hasPersonalDataInPassword(password, context);
  const weakPattern = hasWeakPattern(password);
  const repetitive = hasRepetitivePattern(password);

  const excellentEligible =
    password.length > 12 && !personal && !weakPattern && !repetitive;

  if (excellentEligible) {
    return { level: "excellent", levelLabel: "💎 Excelente" };
  }

  return { level: "strong", levelLabel: "🟢 Forte" };
}

export function validateStrongPassword(
  password: string,
  context: PasswordValidationContext = {}
): StrongPasswordResult {
  const emailBlocked = passwordContainsEmail(password, context.email);
  const nameBlocked = passwordContainsName(password, context.name);
  const usernameBlocked = passwordContainsUsername(password, context.username);
  const phoneBlocked = passwordContainsPhone(password, context.phone);
  const birthBlocked = passwordContainsBirthDate(password, context.birthDate);

  const validationChecks: PasswordRequirementCheck[] = [
    {
      id: "length",
      label: "Possui 8 caracteres",
      met: password.length >= 8,
      mandatory: true,
    },
    {
      id: "uppercase",
      label: "Possui letra maiúscula",
      met: /[A-Z]/.test(password),
      mandatory: true,
    },
    {
      id: "lowercase",
      label: "Possui letra minúscula",
      met: /[a-z]/.test(password),
      mandatory: true,
    },
    {
      id: "number",
      label: "Possui número",
      met: /[0-9]/.test(password),
      mandatory: true,
    },
    {
      id: "special",
      label: "Possui caractere especial",
      met: /[^A-Za-z0-9]/.test(password),
      mandatory: true,
    },
    { id: "no-space", label: "Sem espaços", met: !/\s/.test(password), mandatory: true },
    { id: "no-email", label: "Não contém o e-mail", met: !emailBlocked, mandatory: true },
    { id: "no-name", label: "Não contém nome ou sobrenome", met: !nameBlocked, mandatory: true },
    { id: "no-username", label: "Não contém o nome de usuário", met: !usernameBlocked, mandatory: true },
    { id: "no-phone", label: "Não contém o telefone", met: !phoneBlocked, mandatory: true },
    { id: "no-birthdate", label: "Não contém a data de nascimento", met: !birthBlocked, mandatory: true },
  ];

  const optional: PasswordRequirementCheck[] = [
    { id: "len12", label: "12+ caracteres (recomendado)", met: password.length >= 12, mandatory: false },
    {
      id: "no-common",
      label: "Evita sequências previsíveis",
      met: password.length > 0 && !hasWeakPattern(password),
      mandatory: false,
    },
  ];

  const requirements = [...validationChecks.filter((r) =>
    ["length", "uppercase", "lowercase", "number", "special"].includes(r.id)
  ), ...optional];
  const allMandatory = validationChecks.filter((r) => r.mandatory);
  const failedStructural = allMandatory.find(
    (r) => STRUCTURAL_REQUIREMENT_IDS.includes(r.id as (typeof STRUCTURAL_REQUIREMENT_IDS)[number]) && !r.met
  );
  const failedPersonal = allMandatory.find(
    (r) => PERSONAL_REQUIREMENT_IDS.includes(r.id as (typeof PERSONAL_REQUIREMENT_IDS)[number]) && !r.met
  );
  const failedValidation = failedStructural ?? failedPersonal;
  const valid = !failedValidation;
  const { level, levelLabel } = classifyPasswordLevel(password, context);

  return {
    valid,
    error: failedValidation ? ERROR_MESSAGES[failedValidation.id] : undefined,
    level,
    levelLabel,
    requirements,
  };
}

export function strongPasswordError(
  password: string,
  context: PasswordValidationContext = {}
): string | undefined {
  return validateStrongPassword(password, context).error;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
