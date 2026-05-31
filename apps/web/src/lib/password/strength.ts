export type PasswordStrength = "weak" | "medium" | "strong" | "excellent";

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordAnalysis {
  strength: PasswordStrength;
  score: number;
  requirements: PasswordRequirement[];
  isValid: boolean;
  label: string;
  color: string;
  barWidth: string;
}

const REQUIREMENT_CHECKS = [
  { id: "length", label: "Tamanho mínimo (8 caracteres)", test: (p: string) => p.length >= 8 },
  { id: "length12", label: "Recomendado 12+ caracteres", test: (p: string) => p.length >= 12 },
  { id: "uppercase", label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "Número", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "Caractere especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function analyzePassword(password: string): PasswordAnalysis {
  const requirements = REQUIREMENT_CHECKS.map((r) => ({
    id: r.id,
    label: r.label,
    met: r.test(password),
  }));

  const coreMet = [
    requirements.find((r) => r.id === "length")?.met,
    requirements.find((r) => r.id === "uppercase")?.met,
    requirements.find((r) => r.id === "lowercase")?.met,
    requirements.find((r) => r.id === "number")?.met,
    requirements.find((r) => r.id === "special")?.met,
  ].filter(Boolean).length;

  const has12 = requirements.find((r) => r.id === "length12")?.met;
  let score = coreMet;
  if (has12) score += 1;
  if (password.length >= 16) score += 1;

  let strength: PasswordStrength = "weak";
  let label = "Fraca";
  let color = "bg-red-500";
  let barWidth = "w-1/4";

  if (score >= 6) {
    strength = "excellent";
    label = "Excelente";
    color = "bg-ecopet-green";
    barWidth = "w-full";
  } else if (score >= 5) {
    strength = "strong";
    label = "Forte";
    color = "bg-ecopet-green";
    barWidth = "w-3/4";
  } else if (score >= 3) {
    strength = "medium";
    label = "Média";
    color = "bg-ecopet-yellow";
    barWidth = "w-1/2";
  }

  const isValid = coreMet >= 5;

  return { strength, score, requirements, isValid, label, color, barWidth };
}

export function validatePasswordForRegistration(password: string, confirmPassword: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const analysis = analyzePassword(password);

  if (!password) {
    errors.password = "Senha é obrigatória";
  } else if (!analysis.isValid) {
    errors.password = "Senha não atende aos requisitos de segurança";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem";
  }

  return errors;
}
