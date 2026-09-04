import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin({ path: "/api/admin/commerce" });
  if (error) return error;

  const [
    subscriptions,
    entitlements,
    cases,
    enrollments,
    memberships,
    credits,
    conversations,
    quotes,
    quoteRejected,
    converted,
    refunds,
    disputes,
    reports,
  ] = await Promise.all([
    prisma.catalogSubscription.count(),
    prisma.catalogEntitlement.count(),
    prisma.healthClinicalCase.count(),
    prisma.protectionEnrollment.count(),
    prisma.entertainmentMembership.count(),
    prisma.creditLedgerEntry.count(),
    prisma.conversation.count({ where: { type: "CLIENT_PARTNER" } }),
    prisma.customQuote.count(),
    prisma.customQuote.count({ where: { status: "REJECTED" } }),
    prisma.customQuote.count({ where: { status: { in: ["CONVERTED", "COMPLETED"] } } }),
    prisma.paymentRefund.count(),
    prisma.mpDispute.count().catch(() => 0),
    prisma.messageReport.count(),
  ]);

  const recentQuotes = await prisma.customQuote.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      value: true,
      includedItems: true,
      conversationId: true,
      requesterId: true,
      providerId: true,
      createdAt: true,
    },
  });

  const recentConversations = await prisma.conversation.findMany({
    where: { type: "CLIENT_PARTNER" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      contextType: true,
      lastMessageAt: true,
    },
  });

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
    counts: {
      subscriptions,
      entitlements,
      cases,
      enrollments,
      memberships,
      credits,
      commercialConversations: conversations,
      quotes,
      quotesRejected: quoteRejected,
      quotesConverted: converted,
      refunds,
      disputes,
      messageReports: reports,
    },
    recentCases,
    recentEnrollments,
    recentQuotes,
    recentConversations,
    splitReady: false,
    splitInfraReady: true,
    entertainment: { sku: "ENT-DRAFT", status: "PRICE_PENDING", billingEnabled: false },
  });
}
