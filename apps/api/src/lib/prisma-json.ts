import type { Prisma } from "@prisma/client";

/** Converte valores dinâmicos para o tipo JSON aceito pelo Prisma. */
export function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function asOptionalInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return asInputJson(value);
}
