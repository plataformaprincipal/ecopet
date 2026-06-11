import { z } from "zod";
import { USER_MESSAGES } from "../lib/app-errors.js";

function isNotFutureDate(value: string): boolean {
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d <= today;
}

export const birthDateSchema = z
  .string()
  .min(1, "Data de nascimento obrigatória")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data de nascimento inválida")
  .refine(isNotFutureDate, USER_MESSAGES.BIRTH_DATE_FUTURE);

export const optionalBirthDateSchema = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Data de nascimento inválida")
  .refine((v) => !v || isNotFutureDate(v), USER_MESSAGES.BIRTH_DATE_FUTURE);
