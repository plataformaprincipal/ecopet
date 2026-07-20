/** Máscara segura para secrets em painéis admin. */
export function maskSecretPreview(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (v.length < 8) return "***";
  return `${v.slice(0, 3)}…${v.slice(-2)}`;
}
