import type { PrismaClient } from "@prisma/client";

export type CatalogDeleteBlockReason = "HAS_ORDERS" | "HAS_APPOINTMENTS" | null;

export async function getProductDeleteBlockReason(
  db: Pick<PrismaClient, "orderItem">,
  productId: string
): Promise<CatalogDeleteBlockReason> {
  const count = await db.orderItem.count({ where: { productId } });
  return count > 0 ? "HAS_ORDERS" : null;
}

export async function getServiceDeleteBlockReason(
  db: Pick<PrismaClient, "appointment">,
  serviceId: string
): Promise<CatalogDeleteBlockReason> {
  const count = await db.appointment.count({
    where: {
      serviceId,
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
  });
  return count > 0 ? "HAS_APPOINTMENTS" : null;
}
