import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import { loadPartnerErpStore } from "./store";

type MarketingStore = {
  campaigns: Array<Record<string, unknown>>;
  emails: Array<Record<string, unknown>>;
  push: Array<Record<string, unknown>>;
  sms: Array<Record<string, unknown>>;
  seo: Array<Record<string, unknown>>;
  ads: Array<Record<string, unknown>>;
};

const EMPTY_MARKETING: MarketingStore = {
  campaigns: [],
  emails: [],
  push: [],
  sms: [],
  seo: [],
  ads: [],
};

type FidelidadeStore = {
  coupons: Array<Record<string, unknown>>;
  programs: Array<Record<string, unknown>>;
  subscriptions: Array<Record<string, unknown>>;
};

const EMPTY_FIDELIDADE: FidelidadeStore = {
  coupons: [],
  programs: [],
  subscriptions: [],
};

type MarketplaceExtrasStore = {
  promotions: Array<Record<string, unknown>>;
  coupons: Array<Record<string, unknown>>;
  kits: Array<Record<string, unknown>>;
  combos: Array<Record<string, unknown>>;
};

const EMPTY_MARKETPLACE_EXTRAS: MarketplaceExtrasStore = {
  promotions: [],
  coupons: [],
  kits: [],
  combos: [],
};

export const PARTNER_GROWTH_AI_ASSISTANTS = [
  {
    id: "campaigns",
    label: "Criar campanhas",
    agentId: "marketing",
    description: "Rascunhos de campanhas multicanal e ROI estimado",
  },
  {
    id: "posts",
    label: "Criar posts",
    agentId: "marketing",
    description: "Legendas, hashtags e calendário de publicações",
  },
  {
    id: "customer_reply",
    label: "Responder clientes",
    agentId: "commercial",
    description: "Respostas empáticas para dúvidas e reclamações",
  },
  {
    id: "recommendations",
    label: "Recomendar produtos",
    agentId: "marketplace",
    description: "Sugestões personalizadas com base no catálogo",
  },
] as const;

export async function getPartnerMarketingModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "marketing", EMPTY_MARKETING);

  const [notifications, orders] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: partnerId, type: { in: ["CAMPAIGN", "SYSTEM", "PRODUCT"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, title: true, type: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { partnerId },
      select: { total: true, discount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const discounts = orders.reduce((s, o) => s + o.discount, 0);
  const roiEst = discounts > 0 ? Math.round((revenue / discounts) * 100) / 100 : 0;

  const pushRows =
    store.push.length > 0
      ? store.push
      : notifications
          .filter((n) => n.type === "CAMPAIGN" || n.type === "PRODUCT")
          .map((n) => ({
            id: n.id,
            titulo: n.title,
            canal: n.type,
            data: n.createdAt.toISOString(),
          }));

  return {
    moduleId: "marketing",
    title: "Marketing",
    kpis: [
      kpi("campaigns", "Campanhas", store.campaigns.length),
      kpi("email", "E-mail", store.emails.length),
      kpi("push", "Push", pushRows.length),
      kpi("sms", "SMS", store.sms.length),
      kpi("seo", "SEO", store.seo.length),
      kpi("ads", "Anúncios", store.ads.length),
      kpi("roi", "ROI est.", roiEst),
    ],
    tables: [
      { id: "campaigns", label: "Campanhas", rows: store.campaigns },
      { id: "email", label: "E-mail", rows: store.emails },
      { id: "push", label: "Push", rows: pushRows },
      { id: "sms", label: "SMS", rows: store.sms },
      { id: "seo", label: "SEO", rows: store.seo },
      { id: "ads", label: "Anúncios", rows: store.ads },
      {
        id: "roi",
        label: "ROI",
        rows: [
          { id: "summary", receita: revenue, descontos: discounts, roi: roiEst, pedidos: orders.length },
        ],
      },
    ],
    tabs: [
      { id: "campaigns", label: "Campanhas" },
      { id: "email", label: "E-mail" },
      { id: "push", label: "Push" },
      { id: "sms", label: "SMS" },
      { id: "seo", label: "SEO" },
      { id: "ads", label: "Anúncios" },
      { id: "roi", label: "ROI" },
    ],
    quickActions: PARTNER_GROWTH_AI_ASSISTANTS.filter((a) => a.id === "campaigns").map((a) => ({
      label: a.label,
      href: `/partner/ia?assistant=${a.id}`,
    })),
    disclaimer:
      store.campaigns.length === 0
        ? "Cadastre campanhas via POST ou use o assistente IA para criar rascunhos."
        : undefined,
  };
}

export async function getPartnerSocialModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const [profile, posts, followers, following, comments, conversations] = await Promise.all([
    prisma.publicProfile.findUnique({
      where: { userId: partnerId },
      select: { displayName: true, bio: true, avatarUrl: true, coverUrl: true, visibility: true },
    }),
    prisma.socialPost.findMany({
      where: { authorId: partnerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        media: { select: { mediaType: true, fileUrl: true } },
        _count: { select: { likes: true, comments: true, shares: true } },
      },
    }),
    prisma.userFollow.count({ where: { followingId: partnerId } }),
    prisma.userFollow.count({ where: { followerId: partnerId } }),
    prisma.socialComment.findMany({
      where: { post: { authorId: partnerId }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { author: { select: { name: true } }, post: { select: { id: true, content: true } } },
    }),
    prisma.conversationParticipant.findMany({
      where: { userId: partnerId },
      take: 10,
      orderBy: { joinedAt: "desc" },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            lastMessageAt: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, createdAt: true } },
          },
        },
      },
    }),
  ]);

  const postIds = posts.map((p) => p.id);
  const reports = postIds.length
    ? await prisma.socialReport.findMany({
        where: { postId: { in: postIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, reason: true, status: true, createdAt: true, postId: true },
      })
    : [];

  const stories = posts.filter((p) => p.media.some((m) => m.mediaType === "IMAGE")).slice(0, 10);
  const videos = posts.filter((p) => p.media.some((m) => m.mediaType === "VIDEO"));

  const profileRow = profile
    ? [{ id: "profile", nome: profile.displayName, bio: profile.bio ?? "", visibilidade: profile.visibility }]
    : [];

  return {
    moduleId: "social",
    title: "Rede Social",
    kpis: [
      kpi("profile", "Perfil", profile ? "Ativo" : "Pendente", { variant: profile ? "success" : "warning" }),
      kpi("posts", "Posts", posts.length),
      kpi("stories", "Stories", stories.length),
      kpi("videos", "Vídeos", videos.length),
      kpi("comments", "Comentários", comments.length),
      kpi("messages", "Mensagens", conversations.length),
      kpi("followers", "Seguidores", followers),
      kpi("following", "Seguindo", following),
    ],
    tables: [
      { id: "profile", label: "Perfil empresarial", rows: profileRow },
      {
        id: "posts",
        label: "Posts",
        rows: posts.map((p) => ({
          id: p.id,
          tipo: p.type,
          conteudo: p.content.slice(0, 120),
          curtidas: p._count.likes,
          comentarios: p._count.comments,
          compartilhamentos: p._count.shares,
          data: p.createdAt.toISOString(),
        })),
      },
      {
        id: "stories",
        label: "Stories",
        rows: stories.map((p) => ({
          id: p.id,
          midia: p.media[0]?.mediaType ?? "IMAGE",
          data: p.createdAt.toISOString(),
        })),
      },
      {
        id: "videos",
        label: "Vídeos",
        rows: videos.map((p) => ({
          id: p.id,
          conteudo: p.content.slice(0, 80),
          data: p.createdAt.toISOString(),
        })),
      },
      {
        id: "comments",
        label: "Comentários",
        rows: comments.map((c) => ({
          id: c.id,
          autor: c.author.name ?? "—",
          conteudo: c.content.slice(0, 100),
          post: c.post.content.slice(0, 40),
          data: c.createdAt.toISOString(),
        })),
      },
      {
        id: "messages",
        label: "Mensagens",
        rows: conversations.map((cp) => ({
          id: cp.conversation.id,
          titulo: cp.conversation.title ?? "Conversa",
          ultima: cp.conversation.messages[0]?.content?.slice(0, 80) ?? "—",
          data: cp.conversation.lastMessageAt?.toISOString() ?? cp.joinedAt.toISOString(),
        })),
      },
      {
        id: "followers",
        label: "Seguidores",
        rows: [{ id: "count", total: followers }],
      },
      {
        id: "reports",
        label: "Denúncias (posts)",
        rows: reports.map((r) => ({
          id: r.id,
          motivo: r.reason,
          status: r.status,
          postId: r.postId,
          data: r.createdAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "profile", label: "Perfil" },
      { id: "posts", label: "Posts" },
      { id: "stories", label: "Stories" },
      { id: "videos", label: "Vídeos" },
      { id: "comments", label: "Comentários" },
      { id: "messages", label: "Mensagens" },
      { id: "followers", label: "Seguidores" },
    ],
    quickActions: [
      { label: "Abrir feed", href: "/partner/social#feed" },
      { label: "Criar post (IA)", href: "/partner/ia?assistant=posts" },
    ],
    disclaimer: !profile ? "Complete o perfil público para fortalecer a presença na rede." : undefined,
  };
}

export async function getPartnerClientesModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const [orders, appointments] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      include: { user: { select: { id: true, name: true, email: true } }, items: { select: { quantity: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.appointment.findMany({
      where: { partnerId },
      include: { user: { select: { id: true, name: true, email: true } }, service: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    }),
  ]);

  const customerIds = [...new Set([...orders.map((o) => o.userId), ...appointments.map((a) => a.userId)])];
  const pets = customerIds.length
    ? await prisma.pet.findMany({
        where: { ownerId: { in: customerIds } },
        select: { id: true, name: true, species: true, ownerId: true },
        take: 40,
      })
    : [];

  const agg = new Map<
    string,
    { id: string; nome: string; email: string | null; compras: number; consultas: number; total: number; ultima: string }
  >();

  for (const o of orders) {
    const u = o.user;
    if (!u) continue;
    const prev = agg.get(u.id);
    agg.set(u.id, {
      id: u.id,
      nome: u.name ?? "Cliente",
      email: u.email,
      compras: (prev?.compras ?? 0) + 1,
      consultas: prev?.consultas ?? 0,
      total: (prev?.total ?? 0) + o.total,
      ultima: o.createdAt.toISOString(),
    });
  }
  for (const a of appointments) {
    const u = a.user;
    if (!u) continue;
    const prev = agg.get(u.id);
    const when = (a.scheduledAt ?? a.createdAt).toISOString();
    agg.set(u.id, {
      id: u.id,
      nome: u.name ?? "Cliente",
      email: u.email,
      compras: prev?.compras ?? 0,
      consultas: (prev?.consultas ?? 0) + 1,
      total: prev?.total ?? 0,
      ultima: when > (prev?.ultima ?? "") ? when : (prev?.ultima ?? when),
    });
  }

  const clients = [...agg.values()].sort((a, b) => (a.ultima < b.ultima ? 1 : -1));
  const fidelidadeStore = await loadPartnerErpStore(partnerId, "fidelidade", EMPTY_FIDELIDADE);

  return {
    moduleId: "clientes",
    title: "Relacionamento",
    kpis: [
      kpi("clients", "Clientes", clients.length),
      kpi("pets", "Pets vinculados", pets.length),
      kpi("orders", "Compras", orders.length),
      kpi("appointments", "Consultas", appointments.length),
      kpi("loyalty", "Programas fidelidade", fidelidadeStore.programs.length),
    ],
    tables: [
      {
        id: "history",
        label: "Histórico",
        rows: clients.map((c) => ({
          id: c.id,
          cliente: c.nome,
          email: c.email,
          compras: c.compras,
          consultas: c.consultas,
          total: c.total,
          ultima: c.ultima,
        })),
      },
      {
        id: "pets",
        label: "Pets",
        rows: pets.map((p) => ({
          id: p.id,
          nome: p.name,
          especie: p.species,
          tutorId: p.ownerId,
        })),
      },
      {
        id: "purchases",
        label: "Compras",
        rows: orders.slice(0, 20).map((o) => ({
          id: o.id,
          cliente: o.user?.name ?? "—",
          total: o.total,
          itens: o.items.reduce((s, i) => s + i.quantity, 0),
          status: o.status,
          data: o.createdAt.toISOString(),
        })),
      },
      {
        id: "consultations",
        label: "Consultas",
        rows: appointments.slice(0, 20).map((a) => ({
          id: a.id,
          cliente: a.user?.name ?? "—",
          servico: a.service?.name ?? "—",
          status: a.status,
          data: (a.scheduledAt ?? a.createdAt).toISOString(),
        })),
      },
      {
        id: "loyalty",
        label: "Fidelidade",
        rows: fidelidadeStore.programs,
      },
    ],
    tabs: [
      { id: "history", label: "Histórico" },
      { id: "pets", label: "Pets" },
      { id: "purchases", label: "Compras" },
      { id: "consultations", label: "Consultas" },
      { id: "loyalty", label: "Fidelidade" },
    ],
    quickActions: [
      { label: "Responder clientes (IA)", href: "/partner/ia?assistant=customer_reply" },
      { label: "Programa de fidelidade", href: "/partner/fidelidade" },
    ],
  };
}

export async function getPartnerFidelidadeModule(prisma: PrismaClient, partnerId: string): Promise<ErpModuleResponse> {
  const store = await loadPartnerErpStore(partnerId, "fidelidade", EMPTY_FIDELIDADE);

  const [orders, orderIds] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      select: { id: true, userId: true, total: true, discount: true },
      take: 200,
    }),
    prisma.order.findMany({
      where: { partnerId },
      select: { id: true },
      take: 500,
    }),
  ]);

  const ids = orderIds.map((o) => o.id);
  const cashbacks =
    ids.length > 0
      ? await prisma.cashback.findMany({
          where: { orderId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];

  const pointsEst = Math.round(orders.reduce((s, o) => s + o.total, 0) / 10);
  const cashbackTotal = cashbacks.reduce((s, c) => s + c.amount, 0);

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: partnerId },
    select: { id: true, plan: true, active: true, expiresAt: true, createdAt: true },
    take: 10,
  });

  const subRows =
    store.subscriptions.length > 0
      ? store.subscriptions
      : subscriptions.map((s) => ({
          id: s.id,
          plano: s.plan,
          ativo: s.active,
          expira: s.expiresAt?.toISOString() ?? "—",
          data: s.createdAt.toISOString(),
        }));

  return {
    moduleId: "fidelidade",
    title: "Fidelização",
    kpis: [
      kpi("points", "Pontos (est.)", pointsEst),
      kpi("cashback", "Cashback", cashbackTotal),
      kpi("coupons", "Cupons", store.coupons.length),
      kpi("subscriptions", "Assinaturas", subRows.length),
    ],
    tables: [
      {
        id: "points",
        label: "Pontos",
        rows: [{ id: "est", pontos: pointsEst, base: "R$ 10 = 1 ponto (estimativa)" }],
      },
      {
        id: "cashback",
        label: "Cashback",
        rows: cashbacks.map((c) => ({
          id: c.id,
          valor: c.amount,
          percentual: c.percentage,
          aplicado: c.applied,
          data: c.createdAt.toISOString(),
        })),
      },
      { id: "coupons", label: "Cupons", rows: store.coupons },
      { id: "subscriptions", label: "Assinaturas", rows: subRows },
    ],
    tabs: [
      { id: "points", label: "Pontos" },
      { id: "cashback", label: "Cashback" },
      { id: "coupons", label: "Cupons" },
      { id: "subscriptions", label: "Assinaturas" },
    ],
    disclaimer: store.coupons.length === 0 ? "Configure cupons e programas de pontos no store ERP." : undefined,
  };
}

export async function loadMarketplaceExtras(partnerId: string) {
  return loadPartnerErpStore(partnerId, "marketplace", EMPTY_MARKETPLACE_EXTRAS);
}
