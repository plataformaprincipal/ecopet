import "server-only";
import { prisma } from "@/lib/prisma";
import { CatalogCommerceError } from "./checkout";

export async function cancelCatalogSubscription(params: { userId: string; subscriptionId: string; reason?: string }) {
  const sub = await prisma.catalogSubscription.findFirst({
    where: { id: params.subscriptionId, userId: params.userId },
  });
  if (!sub) throw new CatalogCommerceError("NOT_FOUND", "Assinatura não encontrada.", 404);
  if (sub.status === "CANCELLED" || sub.status === "EXPIRED") return sub;
  return prisma.catalogSubscription.update({
    where: { id: sub.id },
    data: {
      status: "CANCEL_SCHEDULED",
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
      cancelReason: params.reason ?? "USER_CANCEL",
    },
  });
}

export async function listUserSubscriptions(userId: string) {
  return prisma.catalogSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listUserEntitlements(userId: string) {
  return prisma.catalogEntitlement.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
