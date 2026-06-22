import type { PrismaClient } from "@prisma/client";
import { unpackRequirements } from "@/lib/ong/adoption-listing-meta";

export type OngAiInsight = {
  id: string;
  title: string;
  description: string;
  href?: string;
  priority: "high" | "medium" | "low";
};

export type OngDashboardSummary = {
  animalsCount: number;
  adoptionsInProgress: number;
  helpRequests: number;
  pendingMessages: number;
  recentPostsCount: number;
  availableAnimals: number;
  insights: OngAiInsight[];
  recentAnimals: Array<{ id: string; name: string; status: string; createdAt: string }>;
};

export async function buildOngDashboardSummary(
  prisma: PrismaClient,
  ongId: string
): Promise<OngDashboardSummary> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    listings,
    pendingMessages,
    recentPostsCount,
    openTickets,
    profile,
  ] = await Promise.all([
    prisma.adoptionListing.findMany({
      where: { ongId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.count({
      where: {
        read: false,
        deletedAt: null,
        senderId: { not: ongId },
        conversation: {
          participants: { some: { userId: ongId, leftAt: null } },
        },
      },
    }),
    prisma.socialPost.count({
      where: {
        authorId: ongId,
        status: "PUBLISHED",
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.supportTicket.count({
      where: { requesterId: ongId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.ongProfile.findUnique({
      where: { userId: ongId },
      select: { description: true, photos: true, documents: true, verificationStatus: true },
    }),
  ]);

  const adoptionsInProgress = listings.filter((l) => l.status === "PENDING").length;
  const availableAnimals = listings.filter((l) => {
    const { meta } = unpackRequirements(l.requirements);
    return l.status === "AVAILABLE" && !meta.unavailable;
  }).length;

  const insights: OngAiInsight[] = [];

  if (!profile?.description?.trim()) {
    insights.push({
      id: "complete-profile",
      title: "Complete o perfil da ONG",
      description: "Descrição e missão ajudam adotantes a confiar na sua instituição.",
      href: "/ong/perfil-gestao",
      priority: "high",
    });
  }

  const staleAnimals = listings.filter((l) => {
    const { meta } = unpackRequirements(l.requirements);
    return (
      l.status === "AVAILABLE" &&
      !meta.unavailable &&
      l.createdAt < thirtyDaysAgo &&
      (!l.photos || (Array.isArray(l.photos) && l.photos.length === 0))
    );
  });
  if (staleAnimals.length > 0) {
    insights.push({
      id: "update-photos",
      title: `${staleAnimals.length} animal(is) sem fotos recentes`,
      description: "Atualize imagens para aumentar chances de adoção.",
      href: "/ong/adocoes",
      priority: "medium",
    });
  }

  const noDescription = listings.filter((l) => !l.description?.trim() || l.description.length < 40);
  if (noDescription.length > 0) {
    insights.push({
      id: "improve-descriptions",
      title: "Melhore descrições dos animais",
      description: `${noDescription.length} cadastro(s) com descrição curta ou vazia.`,
      href: "/ong/adocoes",
      priority: "medium",
    });
  }

  if (pendingMessages > 0) {
    insights.push({
      id: "reply-messages",
      title: `${pendingMessages} mensagem(ns) aguardando resposta`,
      description: "Interessados em adoção esperam retorno.",
      href: "/dashboard/messages",
      priority: "high",
    });
  }

  if (listings.length === 0) {
    insights.push({
      id: "register-animal",
      title: "Cadastre seu primeiro animal",
      description: "Publique animais disponíveis para adoção.",
      href: "/ong/adocoes",
      priority: "high",
    });
  }

  const pendingReview = listings.filter((l) => l.status === "PENDING");
  if (pendingReview.length > 0) {
    insights.push({
      id: "review-pending",
      title: "Revise adoções em análise",
      description: `${pendingReview.length} animal(is) com status em análise.`,
      href: "/ong/adocoes",
      priority: "low",
    });
  }

  return {
    animalsCount: listings.length,
    adoptionsInProgress,
    helpRequests: openTickets,
    pendingMessages,
    recentPostsCount,
    availableAnimals,
    insights,
    recentAnimals: listings.slice(0, 5).map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
