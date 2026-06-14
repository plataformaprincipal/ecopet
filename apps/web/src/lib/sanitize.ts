export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function optionalSanitizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = sanitizeText(value);
  return trimmed.length > 0 ? trimmed : null;
}
