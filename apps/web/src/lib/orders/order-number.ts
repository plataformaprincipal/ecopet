import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Gera o próximo número fora da transação interativa — evita aggregate no tx expirado. */
export async function allocateNextOrderNumber(): Promise<number> {
  const last = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 1000) + 1;
}

export function isOrderNumberConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const CHECKOUT_DB_TX = { maxWait: 5_000, timeout: 15_000 } as const;

export async function withCheckoutCreateRetry<T>(run: (orderNumber: number) => Promise<T>): Promise<T> {
  let lastError: unknown = new Error("ORDER_NUMBER_EXHAUSTED");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = await allocateNextOrderNumber();
    try {
      return await run(orderNumber);
    } catch (error) {
      lastError = error;
      if (isOrderNumberConflict(error)) continue;
      throw error;
    }
  }
  throw lastError;
}

export function moneyEquals(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}
