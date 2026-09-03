import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/commerce" });
  if (error) return error;
  const [subscriptions, entitlements, cases, enrollments, memberships, credits] = await Promise.all([
    prisma.catalogSubscription.count(),
    prisma.catalogEntitlement.count(),
    prisma.healthClinicalCase.count(),
    prisma.protectionEnrollment.count(),
    prisma.entertainmentMembership.count(),
    prisma.creditLedgerEntry.count(),
  ]);
  const recentCases = await prisma.healthClinicalCase.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, sku: true, status: true, crmv: true, createdAt: true },
  });
  const recentEnrollments = await prisma.protectionEnrollment.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, sku: true, status: true, amountCents: true, createdAt: true },
  });
  return apiSuccess({
    counts: { subscriptions, entitlements, cases, enrollments, memberships, credits },
    recentCases,
    recentEnrollments,
    splitReady: false,
    splitInfraReady: true,
    entertainment: { sku: "ENT-DRAFT", status: "PRICE_PENDING", billingEnabled: false },
  });
}
