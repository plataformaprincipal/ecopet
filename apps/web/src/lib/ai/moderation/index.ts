export type ModerationResult = {
  allowed: boolean;
  categories: string[];
  reason?: string;
};

const BLOCKED_PATTERNS = [
  /\b(hack|exploit|bypass)\s+(senha|password|auth)/i,
  /\b(ignore|disregard)\s+(previous|all)\s+instructions/i,
];

export async function moderateInput(text: string): Promise<ModerationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { allowed: false, categories: ["empty"], reason: "Mensagem vazia." };
  }
  if (trimmed.length > 8000) {
    return { allowed: false, categories: ["length"], reason: "Mensagem excede o limite permitido." };
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, categories: ["injection"], reason: "Conteúdo não permitido." };
    }
  }
  return { allowed: true, categories: [] };
}

export async function moderateOutput(text: string): Promise<ModerationResult> {
  return moderateInput(text);
}
