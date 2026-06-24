import { z } from "zod";

/** Após trim + lowercase */
export const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

export const USERNAME_INVALID_MESSAGE =
  "Use de 3 a 30 caracteres contendo letras, números, ponto, underline ou hífen.";

export function sanitizeUsernameInput(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
    .slice(0, 30);
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  if (!normalized) return false;
  return USERNAME_REGEX.test(normalized);
}

export const usernameSchema = z
  .string()
  .min(1, USERNAME_INVALID_MESSAGE)
  .transform(normalizeUsername)
  .refine((v) => USERNAME_REGEX.test(v), USERNAME_INVALID_MESSAGE);
