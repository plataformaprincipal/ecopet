export type PasswordStrengthLevel = "weak" | "medium" | "strong" | "very_strong" | "excellent";

export type PasswordValidationContext = {
  email?: string;
  name?: string;
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

const ERROR_MESSAGES: Record<string, string> = {
  length: "A senha deve possuir no mínimo 8 caracteres.",
  uppercase: "A senha deve possuir ao menos uma letra maiúscula.",
  lowercase: "A senha deve possuir ao menos uma letra minúscula.",
  number: "A senha deve possuir ao menos um número.",
  special: "A senha deve possuir ao menos um caractere especial.",
  "no-space": "A senha não pode conter espaços.",
  "no-email": "A senha não pode conter o e-mail.",
  "no-name": "A senha não pode conter o nome.",
};

const WEAK_PATTERNS = ["123456", "abcdef", "qwerty"];

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

function passwordContainsEmail(password: string, email?: string): boolean {
  if (!email?.trim()) return false;
  const trimmed = email.trim().toLowerCase();
  const local = trimmed.split("@")[0] ?? "";
  return containsNormalized(password, trimmed) || containsNormalized(password, local);
}

function passwordContainsName(password: string, name?: string): boolean {
  if (!name?.trim()) return false;
  const parts = name.trim().split(/\s+/).filter((p) => p.length >= 3);
  if (containsNormalized(password, name.trim())) return true;
  return parts.some((part) => containsNormalized(password, part));
}

function hasWeakPattern(password: string): boolean {
  const normalized = normalize(password);
  return WEAK_PATTERNS.some((p) => normalized.includes(p));
}

export function meetsMediumRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function classifyPasswordLevel(password: string): {
  level: PasswordStrengthLevel;
  levelLabel: string;
} {
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!meetsMediumRequirements(password)) {
    return { level: "weak", levelLabel: "Fraca" };
  }
  if (!hasSpecial) {
    return { level: "medium", levelLabel: "Média" };
  }
  if (password.length < 12) {
    return { level: "strong", levelLabel: "Forte" };
  }
  if (password.length < 16) {
    return { level: "very_strong", levelLabel: "Muito forte" };
  }
  return { level: "excellent", levelLabel: "Excelente" };
}

export function validateStrongPassword(
  password: string,
  context: PasswordValidationContext = {}
): StrongPasswordResult {
  const emailBlocked = passwordContainsEmail(password, context.email);
  const nameBlocked = passwordContainsName(password, context.name);

  const validationChecks: PasswordRequirementCheck[] = [
    {
      id: "length",
      label: "Mínimo 8 caracteres",
      met: password.length >= 8,
      mandatory: true,
    },
    {
      id: "uppercase",
      label: "Pelo menos 1 letra maiúscula",
      met: /[A-Z]/.test(password),
      mandatory: true,
    },
    {
      id: "lowercase",
      label: "Pelo menos 1 letra minúscula",
      met: /[a-z]/.test(password),
      mandatory: true,
    },
    {
      id: "number",
      label: "Pelo menos 1 número",
      met: /[0-9]/.test(password),
      mandatory: true,
    },
    {
      id: "special",
      label: "Pelo menos 1 caractere especial",
      met: /[^A-Za-z0-9]/.test(password),
      mandatory: false,
    },
    { id: "no-space", label: "Sem espaços", met: !/\s/.test(password), mandatory: true },
    { id: "no-email", label: "Não pode conter o e-mail", met: !emailBlocked, mandatory: true },
    { id: "no-name", label: "Não pode conter o nome", met: !nameBlocked, mandatory: true },
  ];

  const optional: PasswordRequirementCheck[] = [
    { id: "len12", label: "12+ caracteres (Muito forte)", met: password.length >= 12, mandatory: false },
    { id: "len16", label: "16+ caracteres (Excelente)", met: password.length >= 16, mandatory: false },
    {
      id: "no-common",
      label: "Evitar sequências comuns (123456, abcdef, qwerty)",
      met: password.length > 0 && !hasWeakPattern(password),
      mandatory: false,
    },
  ];

  const requirements = [...validationChecks, ...optional];
  const failedValidation = validationChecks.find((r) => r.mandatory && !r.met);
  const valid = !failedValidation;
  const { level, levelLabel } = classifyPasswordLevel(password);

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
