/** Remove espaços extras nas extremidades e colapsa espaços duplicados. */
export function normalizeFullName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export const FULL_NAME_INCOMPLETE_MESSAGE = "Escreva o seu nome completo.";

export function getNameWords(name: string): string[] {
  return normalizeFullName(name).split(" ").filter(Boolean);
}

/** Nome completo: mínimo 2 palavras, cada uma com pelo menos 2 caracteres. */
export function isValidFullName(name: string): boolean {
  const words = getNameWords(name);
  return words.length >= 2 && words.every((word) => word.length >= 2);
}

export function getFirstName(name: string): string {
  const words = getNameWords(name);
  return words[0] ?? name.trim();
}

export function getClientDisplayUsername(username: string | null | undefined, fullName: string): string {
  const trimmedUsername = username?.trim();
  if (trimmedUsername) return trimmedUsername;
  return getFirstName(fullName);
}
