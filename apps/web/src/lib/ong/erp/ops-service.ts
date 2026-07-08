import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { buildOngDashboardSummary } from "@/lib/ong/ai-insights";
import {
  unpackRequirements,
  LIFECYCLE_STATUS_LABELS,
  ADOPTION_STAGE_LABELS,
  adoptionStageFromStatus,
} from "@/lib/ong/adoption-listing-meta";
import { kpi, ngoInsights } from "./types";
import { loadNgoErpStore } from "./store";

type DonationStore = {
  donations: Array<Record<string, unknown>>;
  recurring: Array<Record<string, unknown>>;
};

const EMPTY_DONATIONS: DonationStore = { donations: [], recurring: [] };

function monthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function photoUrl(photos: unknown): string | null {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0];
  return typeof first === "string" ? first : null;
}

export async function getNgoDashboardModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const summary = await buildOngDashboardSummary(prisma, ongId);
  const donationStore = await loadNgoErpStore(ongId, "doacoes", EMPTY_DONATIONS);
  const volunteerStore = await loadNgoErpStore(ongId, "voluntariado", { volunteers: [] as unknown[] });
  const financeStore = await loadNgoErpStore(ongId, "financeiro", { expenses: [] as unknown[] });

  const pendingDonations = donationStore.donations.filter(
    (d) => (d.status as string) === "pendente"
  ).length;
  const receivedDonations = donationStore.donations.filter(
    (d) => (d.status as string) === "recebida"
  ).length;
  const monthExpenses = (financeStore.expenses as Array<{ valor?: number; data?: string }>).filter(
    (e) => e.data && new Date(e.data) >= monthStart()
  );
  const monthSpend = monthExpenses.reduce((s, e) => s + (e.valor ?? 0), 0);
  const urgentCampaigns = await prisma.campaign.count({
    where: { ongId, status: "ACTIVE", urgency: { in: ["HIGH", "URGENT"] } },
  });
  const criticalAlerts = summary.insights.filter((i) => i.priority === "high").length;
  const socialEngagement = summary.recentPostsCount + summary.pendingMessages;

  return {
    moduleId: "dashboard",
    title: "Dashboard ONG",
    kpis: [
      kpi("animals", "Animais cadastrados", summary.animalsCount),
      kpi("available", "Disponíveis p/ adoção", summary.availableAnimals),
      kpi("adoptions-progress", "Adoções em andamento", summary.adoptionRequestsPending),
      kpi("adoptions-done", "Adoções concluídas", summary.adoptionRequestsCompleted),
      kpi("donations-received", "Doações recebidas", receivedDonations),
      kpi("donations-pending", "Doações pendentes", pendingDonations, {
        variant: pendingDonations > 0 ? "warning" : "default",
      }),
      kpi("campaigns", "Campanhas ativas", summary.campaignsActive),
      kpi("volunteers", "Voluntários ativos", (volunteerStore.volunteers as unknown[]).length),
      kpi("expenses", "Gastos do mês", `R$ ${monthSpend.toFixed(2)}`),
      kpi("urgent", "Necessidades urgentes", urgentCampaigns, {
        variant: urgentCampaigns > 0 ? "critical" : "default",
      }),
      kpi("alerts", "Alertas críticos", criticalAlerts, {
        variant: criticalAlerts > 0 ? "warning" : "default",
      }),
      kpi("social", "Engajamento social", socialEngagement),
    ],
    alerts: summary.insights
      .filter((i) => i.priority === "high")
      .map((i) => ({
        id: i.id,
        label: i.title,
        count: 1,
        href: i.href,
        severity: "warning" as const,
      })),
    tables: [
      { id: "recent-animals", label: "Animais recentes", rows: summary.recentAnimals },
      { id: "recent-requests", label: "Pedidos recentes", rows: summary.recentRequests },
    ],
    aiInsights: ngoInsights("dashboard"),
    quickActions: [
      { label: "Novo animal", href: "/ngo/animais/novo" },
      { label: "Nova campanha", href: "/ngo/campanhas/nova" },
      { label: "Ver adoções", href: "/ngo/adocoes" },
    ],
  };
}

export async function getNgoAnimaisModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const listings = await prisma.adoptionListing.findMany({
    where: { ongId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rows = listings.map((l) => {
    const { meta, text } = unpackRequirements(l.requirements);
    const lifecycle = meta.lifecycleStatus ?? (l.status === "ADOPTED" ? "adotado" : "disponivel");
    return {
      id: l.id,
      foto: photoUrl(l.photos),
      nome: l.name,
      especie: l.species,
      raca: l.breed ?? "—",
      sexo: meta.sex ?? "—",
      idade: l.age ?? "—",
      porte: meta.size ?? "—",
      peso: meta.weight ?? "—",
      status: LIFECYCLE_STATUS_LABELS[lifecycle] ?? lifecycle,
      localizacao: meta.location ?? (`${meta.city ?? ""} ${meta.state ?? ""}`.trim() || "—"),
      resgate: meta.rescueHistory ?? "—",
      saude: meta.healthCondition ?? "—",
      vacinas: meta.vaccinated ? "Sim" : "Não",
      castracao: meta.neutered ? "Sim" : "Não",
      medicamentos: meta.medications ?? "—",
      comportamento: meta.behavior ?? "—",
      criancas: meta.childFriendly ? "Compatível" : "—",
      outrosAnimais: meta.animalFriendly ? "Compatível" : "—",
      documentos: meta.documents ?? "—",
      observacoes: meta.internalNotes ?? "—",
      requisitos: text,
      editar: `/ngo/animais/${l.id}/editar`,
    };
  });

  const byLifecycle = (key: string) =>
    rows.filter((r) => r.status === (LIFECYCLE_STATUS_LABELS[key] ?? key)).length;

  return {
    moduleId: "animais",
    title: "Gestão de Animais",
    kpis: [
      kpi("total", "Total", rows.length),
      kpi("available", "Disponíveis", byLifecycle("disponivel")),
      kpi("treatment", "Em tratamento", byLifecycle("em_tratamento")),
      kpi("adoption", "Em adoção", byLifecycle("em_processo_adocao")),
      kpi("adopted", "Adotados", byLifecycle("adotado")),
    ],
    tables: [{ id: "animals", label: "Animais", rows }],
    tabs: [
      { id: "animals", label: "Todos" },
      { id: "health", label: "Saúde" },
      { id: "documents", label: "Documentos" },
    ],
    quickActions: [{ label: "Cadastrar animal", href: "/ngo/animais/novo" }],
    disclaimer: rows.length === 0 ? "Nenhum animal cadastrado. Comece pelo botão acima." : undefined,
  };
}

export async function getNgoAdocoesModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const requests = await prisma.adoptionRequest.findMany({
    where: { ongId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      listing: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, email: true } },
    },
  });

  const rows = requests.map((r) => {
    const stage = adoptionStageFromStatus(r.status);
    const history = Array.isArray(r.history) ? r.history : [];
    const last = history[history.length - 1] as { note?: string } | undefined;
    return {
      id: r.id,
      interessado: r.requester.name ?? "—",
      email: r.requester.email ?? "—",
      animal: r.listing?.name ?? "—",
      etapa: ADOPTION_STAGE_LABELS[stage] ?? stage,
      responsavel: "ONG",
      data: r.createdAt.toISOString(),
      status: r.status,
      ultimaNota: last?.note ?? r.message ?? "—",
      acoes: "aprovar|rejeitar|documentos|visita|termo|concluir",
    };
  });

  return {
    moduleId: "adocoes",
    title: "Adoções",
    kpis: [
      kpi("total", "Total", rows.length),
      kpi("pending", "Em andamento", requests.filter((r) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status)).length),
      kpi("completed", "Concluídas", requests.filter((r) => r.status === "COMPLETED").length),
      kpi("rejected", "Rejeitadas", requests.filter((r) => r.status === "REJECTED").length),
    ],
    tables: [{ id: "pipeline", label: "Fluxo de adoção", rows }],
    tabs: [
      { id: "pipeline", label: "Pipeline" },
      { id: "triagem", label: "Triagem" },
      { id: "visita", label: "Visitas" },
      { id: "concluidas", label: "Concluídas" },
    ],
    quickActions: [{ label: "Gerenciar pedidos", href: "/ngo/adocoes" }],
    disclaimer: "Ações sensíveis (aprovar, rejeitar, concluir) são auditadas.",
  };
}

export async function getNgoDoacoesModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "doacoes", EMPTY_DONATIONS);
  const campaigns = await prisma.campaign.findMany({
    where: { ongId },
    select: { id: true, title: true, raisedAmount: true, goalAmount: true },
    take: 20,
  });
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.title]));

  const rows: Array<Record<string, unknown>> = store.donations.map((d) => {
    const row = d as Record<string, unknown>;
    return {
      ...row,
      campanha: row.campaignId ? campaignMap.get(row.campaignId as string) ?? "—" : "—",
    };
  });

  const totalReceived = rows
    .filter((d) => d.status === "recebida" && typeof d.valor === "number")
    .reduce((s, d) => s + (d.valor as number), 0);

  return {
    moduleId: "doacoes",
    title: "Central de Doações",
    kpis: [
      kpi("total", "Registros", rows.length),
      kpi("received", "Recebidas", rows.filter((d) => d.status === "recebida").length),
      kpi("pending", "Pendentes", rows.filter((d) => d.status === "pendente").length, {
        variant: rows.some((d) => d.status === "pendente") ? "warning" : "default",
      }),
      kpi("amount", "Valor recebido", `R$ ${totalReceived.toFixed(2)}`),
      kpi("recurring", "Recorrentes", store.recurring.length),
    ],
    tables: [
      { id: "donations", label: "Doações", rows },
      { id: "recurring", label: "Recorrentes", rows: store.recurring },
      {
        id: "campaigns",
        label: "Por campanha",
        rows: campaigns.map((c) => ({
          id: c.id,
          titulo: c.title,
          arrecadado: c.raisedAmount,
          meta: c.goalAmount,
        })),
      },
    ],
    tabs: [
      { id: "donations", label: "Financeiras" },
      { id: "items", label: "Itens" },
      { id: "recurring", label: "Recorrentes" },
      { id: "receipts", label: "Recibos" },
    ],
    disclaimer: rows.length === 0 ? "Registre doações via POST no módulo ou vincule campanhas ativas." : undefined,
  };
}

export async function getNgoCampanhasModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const campaigns = await prisma.campaign.findMany({
    where: { ongId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const rows = campaigns.map((c) => {
    const progress =
      c.goalAmount && c.goalAmount > 0
        ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100))
        : 0;
    return {
      id: c.id,
      titulo: c.title,
      meta: c.goalAmount ?? "—",
      arrecadado: c.raisedAmount,
      prazo: c.deadline?.toISOString() ?? "—",
      status: c.status,
      categoria: c.category,
      urgencia: c.urgency,
      progresso: `${progress}%`,
      descricao: c.description.slice(0, 120),
      editar: `/ngo/campanhas`,
    };
  });

  return {
    moduleId: "campanhas",
    title: "Campanhas",
    kpis: [
      kpi("active", "Ativas", campaigns.filter((c) => c.status === "ACTIVE").length),
      kpi("draft", "Rascunhos", campaigns.filter((c) => c.status === "DRAFT").length),
      kpi("urgent", "Emergenciais", campaigns.filter((c) => c.urgency === "URGENT").length),
      kpi("raised", "Total arrecadado", campaigns.reduce((s, c) => s + c.raisedAmount, 0)),
    ],
    tables: [{ id: "campaigns", label: "Campanhas", rows }],
    tabs: [
      { id: "campaigns", label: "Todas" },
      { id: "adocao", label: "Adoção" },
      { id: "emergencia", label: "Emergenciais" },
      { id: "castracao", label: "Castração" },
    ],
    quickActions: [
      { label: "Nova campanha", href: "/ngo/campanhas/nova" },
      { label: "Gerenciar", href: "/ngo/campanhas" },
    ],
  };
}

export async function getNgoSocialModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const [publicProfile, ongProfile, socialPosts, followers, comments, conversations] = await Promise.all([
    prisma.publicProfile.findUnique({
      where: { userId: ongId },
      select: { displayName: true, bio: true, avatarUrl: true, coverUrl: true },
    }),
    prisma.ongProfile.findUnique({
      where: { userId: ongId },
      select: { ongName: true, description: true, city: true, state: true, photos: true },
    }),
    prisma.socialPost.findMany({
      where: { authorId: ongId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        media: { select: { mediaType: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.userFollow.count({ where: { followingId: ongId } }),
    prisma.socialComment.findMany({
      where: { post: { authorId: ongId }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { author: { select: { name: true } } },
    }),
    prisma.conversationParticipant.findMany({
      where: { userId: ongId },
      take: 8,
      orderBy: { joinedAt: "desc" },
      include: {
        conversation: {
          select: { id: true, title: true, lastMessageAt: true },
        },
      },
    }),
  ]);

  const listings = await prisma.adoptionListing.count({
    where: { ongId, status: "AVAILABLE" },
  });
  const activeCampaigns = await prisma.campaign.count({ where: { ongId, status: "ACTIVE" } });
  const videos = socialPosts.filter((p) => p.media.some((m) => m.mediaType === "VIDEO"));

  return {
    moduleId: "social",
    title: "Rede Social da ONG",
    kpis: [
      kpi("followers", "Seguidores", followers),
      kpi("posts", "Posts", socialPosts.length),
      kpi("videos", "Vídeos", videos.length),
      kpi("comments", "Comentários", comments.length),
      kpi("messages", "Mensagens", conversations.length),
      kpi("animals", "Animais disponíveis", listings),
      kpi("campaigns", "Campanhas ativas", activeCampaigns),
    ],
    tables: [
      {
        id: "profile",
        label: "Perfil público",
        rows: [
          {
            id: "profile",
            nome: publicProfile?.displayName ?? ongProfile?.ongName ?? "—",
            bio: publicProfile?.bio ?? ongProfile?.description ?? "—",
            cidade: ongProfile?.city ?? "—",
            missao: ongProfile?.description?.slice(0, 200) ?? "—",
          },
        ],
      },
      {
        id: "posts",
        label: "Posts",
        rows: socialPosts.map((p) => ({
          id: p.id,
          conteudo: p.content.slice(0, 100),
          curtidas: p._count.likes,
          comentarios: p._count.comments,
          data: p.createdAt.toISOString(),
        })),
      },
      {
        id: "comments",
        label: "Comentários",
        rows: comments.map((c) => ({
          id: c.id,
          autor: c.author.name ?? "—",
          conteudo: c.content.slice(0, 80),
          data: c.createdAt.toISOString(),
        })),
      },
      {
        id: "messages",
        label: "Mensagens",
        rows: conversations.map((cp) => ({
          id: cp.conversation.id,
          titulo: cp.conversation.title ?? "Conversa",
          data: cp.conversation.lastMessageAt?.toISOString() ?? "—",
        })),
      },
    ],
    quickActions: [
      { label: "Abrir feed", href: "/ngo/social#feed" },
      { label: "Divulgar animal", href: "/ngo/animais" },
      { label: "Mensagens", href: "/ngo/messages" },
    ],
    disclaimer: !publicProfile?.bio && !ongProfile?.description ? "Complete o perfil para fortalecer a presença pública." : undefined,
  };
}
