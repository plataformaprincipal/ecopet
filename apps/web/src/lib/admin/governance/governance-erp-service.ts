import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";
import { loadGovernanceStore } from "./store";

export async function getGovernanceMetrics() {
  const store = await loadGovernanceStore();
  const dayAgo = new Date(Date.now() - 86400000);
  const [
    suspended,
    warnings,
    postsRemoved,
    commentsRemoved,
    partnersSuspended,
    ticketsOpen,
    ticketsCritical,
    reportsPending,
    groupsActive,
    privacyOpen,
    socialOpen,
    contentPending,
    messageReports,
  ] = await Promise.all([
    prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
    Promise.resolve(store.warnings.filter((w) => w.status === "ativa").length),
    prisma.socialPost.count({ where: { status: "REMOVED" } }),
    prisma.socialComment.count({ where: { status: "REMOVED" } }),
    prisma.partnerProfile.count({ where: { verificationStatus: "SUSPENDED" } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING", "WAITING_USER"] } } }),
    prisma.supportTicket.count({ where: { priority: "URGENT", status: { notIn: ["CLOSED", "RESOLVED"] } } }),
    prisma.socialReport.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.conversation.count({ where: { status: { in: ["OPEN", "ACTIVE"] }, type: "INTERNAL" } }),
    prisma.dataPrivacyRequest.count({ where: { status: "OPEN" } }),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.contentReport.count({ where: { status: "PENDING" } }),
    prisma.messageReport.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
  ]);

  const avgResponse = await prisma.supportTicket.aggregate({
    where: { resolvedAt: { not: null }, createdAt: { gte: dayAgo } },
    _avg: { number: true },
  });

  const incidentsCritical = store.incidents.filter((i) => i.severity === "critical" && i.status !== "resolvido").length;

  return [
    { key: "suspended_accounts", label: "Contas suspensas", value: suspended },
    { key: "warnings", label: "Advertências ativas", value: warnings },
    { key: "posts_removed", label: "Posts removidos", value: postsRemoved },
    { key: "comments_removed", label: "Comentários removidos", value: commentsRemoved },
    { key: "stores_suspended", label: "Lojas suspensas", value: partnersSuspended },
    { key: "tickets_open", label: "Tickets abertos", value: ticketsOpen },
    { key: "tickets_critical", label: "Tickets críticos", value: ticketsCritical, variant: ticketsCritical > 0 ? "critical" as const : "default" as const },
    { key: "reports_pending", label: "Denúncias pendentes", value: reportsPending + contentPending + messageReports },
    { key: "groups_active", label: "Grupos ativos", value: groupsActive },
    { key: "incidents_critical", label: "Incidentes críticos", value: incidentsCritical, variant: incidentsCritical > 0 ? "critical" as const : "default" as const },
    { key: "lgpd_pending", label: "Pedidos LGPD pendentes", value: privacyOpen },
    { key: "avg_response", label: "Tickets resolvidos (24h)", value: avgResponse._avg.number ? Math.round(avgResponse._avg.number) : 0 },
    { key: "social_open", label: "Denúncias sociais abertas", value: socialOpen },
  ];
}

async function buildReviewQueue(filters: GestorFilters) {
  const limit = filters.limit;
  const [social, content, messages] = await Promise.all([
    prisma.socialReport.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        reporter: { select: { name: true } },
        post: { select: { id: true, content: true } },
        comment: { select: { id: true, content: true } },
      },
    }),
    prisma.contentReport.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, targetType: true, targetId: true, reason: true, createdAt: true, reporter: { select: { name: true } } },
    }),
    prisma.messageReport.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { reporter: { select: { name: true } }, message: { select: { id: true, content: true } } },
    }),
  ]);

  const items = [
    ...social.map((r) => ({
      id: r.id,
      tipo: r.postId ? "post" : "comentário",
      prioridade: r.reason === "VIOLENCE" || r.reason === "HATE" ? "crítica" : "média",
      status: r.status === "OPEN" ? "pendente" : "em análise",
      motivo: r.reason,
      autorDenuncia: r.reporter.name,
      resumo: r.post?.content?.slice(0, 80) ?? r.comment?.content?.slice(0, 80) ?? "—",
      criadoEm: r.createdAt.toISOString(),
      fonte: "social",
    })),
    ...content.map((r) => ({
      id: r.id,
      tipo: r.targetType,
      prioridade: "média",
      status: "pendente",
      motivo: r.reason,
      autorDenuncia: r.reporter.name,
      resumo: `${r.targetType} #${r.targetId.slice(0, 8)}`,
      criadoEm: r.createdAt.toISOString(),
      fonte: "content",
    })),
    ...messages.map((r) => ({
      id: r.id,
      tipo: "mensagem",
      prioridade: "alta",
      status: "pendente",
      motivo: r.reason ?? "—",
      autorDenuncia: r.reporter.name,
      resumo: r.message?.content?.slice(0, 80) ?? "—",
      criadoEm: r.createdAt.toISOString(),
      fonte: "message",
    })),
  ].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return items.slice(0, limit);
}

export async function getAdminModeracaoModule(filters: GestorFilters) {
  const metrics = await getGovernanceMetrics();
  const queue = await buildReviewQueue(filters);
  const store = await loadGovernanceStore();
  const [posts, comments] = await Promise.all([
    prisma.socialPost.findMany({
      where: { status: { in: ["REPORTED", "HIDDEN", "REMOVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { id: true, content: true, status: true, author: { select: { name: true } }, updatedAt: true },
    }),
    prisma.socialComment.findMany({
      where: { status: { in: ["REPORTED", "HIDDEN", "REMOVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { id: true, content: true, status: true, author: { select: { name: true } }, updatedAt: true },
    }),
  ]);

  return {
    kpis: metrics.filter((m) =>
      ["reports_pending", "posts_removed", "comments_removed", "warnings"].includes(m.key)
    ),
    metrics,
    items: queue,
    tables: [
      {
        id: "queue",
        label: "Fila de revisão unificada",
        rows: queue.length ? queue : [],
      },
      {
        id: "posts",
        label: "Posts em moderação",
        rows: posts.map((p) => ({
          id: p.id,
          autor: p.author.name,
          status: p.status,
          trecho: p.content.slice(0, 60),
          atualizado: p.updatedAt.toISOString(),
        })),
      },
      {
        id: "comments",
        label: "Comentários em moderação",
        rows: comments.map((c) => ({
          id: c.id,
          autor: c.author.name,
          status: c.status,
          trecho: c.content.slice(0, 60),
          atualizado: c.updatedAt.toISOString(),
        })),
      },
      {
        id: "rules",
        label: "Regras automáticas",
        rows: store.rules.map((r) => ({
          id: r.id,
          nome: r.nome,
          gatilho: r.gatilho,
          acao: r.acao,
          ativo: r.ativo ? "Sim" : "Não",
          revisao: r.requerRevisao ? "Humana obrigatória" : "Automática",
        })),
      },
    ],
    tabs: [
      { id: "queue", label: "Fila" },
      { id: "posts", label: "Posts" },
      { id: "comments", label: "Comentários" },
      { id: "profiles", label: "Perfis" },
      { id: "rules", label: "Regras" },
    ],
    disclaimer: queue.length === 0 ? "Nenhuma denúncia pendente na fila unificada." : undefined,
    links: [
      { label: "Moderação social (legado)", href: "/dashboard/admin/social/posts" },
      { label: "Denúncias sociais", href: "/dashboard/admin/social/reports" },
    ],
  };
}

export async function getAdminContasModule(filters: GestorFilters) {
  const metrics = await getGovernanceMetrics();
  const store = await loadGovernanceStore();
  const where = {
    ...dateRangeWhere(filters),
    ...(filters.role ? { role: filters.role as UserRole } : {}),
    ...(filters.status ? { accountStatus: filters.status as "ACTIVE" | "SUSPENDED" | "PENDING" | "REJECTED" } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { email: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        accountStatusReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.user.count({ where }),
  ]);

  const warningByUser = store.warnings.reduce<Record<string, number>>((acc, w) => {
    if (w.status === "ativa") acc[w.userId] = (acc[w.userId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    kpis: metrics.filter((m) => ["suspended_accounts", "warnings"].includes(m.key)),
    metrics,
    items: users.map((u) => ({
      id: u.id,
      nome: u.name,
      email: u.email,
      role: u.role,
      status: u.accountStatus,
      motivo: u.accountStatusReason ?? "—",
      advertencias: warningByUser[u.id] ?? 0,
      criadoEm: u.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    tabs: [
      { id: "all", label: "Todas" },
      { id: "client", label: "Clientes" },
      { id: "partner", label: "Parceiros" },
      { id: "ong", label: "ONGs" },
      { id: "admin", label: "Admins" },
    ],
    disclaimer: users.length === 0 ? "Nenhuma conta encontrada com os filtros atuais." : undefined,
  };
}

function supportRoleFilter(filters: GestorFilters): UserRole | undefined {
  const map: Record<string, UserRole> = {
    clientes: UserRole.CLIENT,
    parceiros: UserRole.PARTNER,
    ongs: UserRole.ONG,
    interno: UserRole.ADMIN,
  };
  if (filters.type && map[filters.type]) return map[filters.type];
  return filters.role as UserRole | undefined;
}

export async function getAdminSuporteModule(filters: GestorFilters) {
  const metrics = await getGovernanceMetrics();
  const roleFilter = supportRoleFilter(filters);
  const dateWhere = dateRangeWhere(filters);
  const ticketWhere = {
    ...dateWhere,
    ...(filters.status ? { status: filters.status as "OPEN" | "IN_PROGRESS" | "CLOSED" } : {}),
    ...(roleFilter ? { requester: { role: roleFilter } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: ticketWhere,
      select: {
        id: true,
        number: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        requester: { select: { name: true, email: true, role: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.supportTicket.count({ where: ticketWhere }),
  ]);

  return {
    kpis: metrics.filter((m) => ["tickets_open", "tickets_critical", "avg_response"].includes(m.key)),
    metrics,
    items: items.map((t) => ({
      id: t.id,
      numero: t.number,
      solicitante: t.requester.name,
      perfil: t.requester.role,
      assunto: t.subject,
      categoria: t.category,
      prioridade: t.priority,
      status: t.status,
      responsavel: t.assignee?.name ?? "—",
      ultimaResposta: t.updatedAt.toISOString(),
      tags: (t.metadata as { tags?: string[] } | null)?.tags?.join(", ") ?? "—",
      criadoEm: t.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    tabs: [
      { id: "clientes", label: "Clientes" },
      { id: "parceiros", label: "Parceiros" },
      { id: "ongs", label: "ONGs" },
      { id: "interno", label: "Interno" },
    ],
    disclaimer: items.length === 0 ? "Nenhum ticket de suporte para este segmento." : undefined,
  };
}

export async function getAdminComunidadeModule(filters: GestorFilters) {
  const metrics = await getGovernanceMetrics();
  const sub = filters.type ?? "grupos";

  if (sub === "mensagens" || sub === "denuncias") {
    const reports = await prisma.messageReport.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      include: {
        reporter: { select: { name: true } },
        message: { select: { content: true, conversationId: true } },
      },
    });
    return {
      kpis: metrics.filter((m) => m.key === "reports_pending"),
      items: reports.map((r) => ({
        id: r.id,
        conversa: r.message?.conversationId?.slice(0, 8) ?? "—",
        trecho: r.message?.content?.slice(0, 80) ?? "—",
        denunciante: r.reporter.name,
        status: r.status,
        criadoEm: r.createdAt.toISOString(),
      })),
      tabs: [
        { id: "grupos", label: "Grupos" },
        { id: "mensagens", label: "Mensagens" },
        { id: "denuncias", label: "Denúncias" },
        { id: "membros", label: "Membros" },
      ],
      disclaimer: reports.length === 0 ? "Nenhuma mensagem denunciada." : undefined,
    };
  }

  if (sub === "membros") {
    const participants = await prisma.conversationParticipant.findMany({
      where: { leftAt: null, conversation: { type: "INTERNAL" } },
      take: filters.limit,
      orderBy: { joinedAt: "desc" },
      include: {
        user: { select: { name: true, role: true, accountStatus: true } },
        conversation: { select: { title: true, id: true } },
      },
    });
    return {
      kpis: metrics.filter((m) => m.key === "groups_active"),
      items: participants.map((p) => ({
        id: p.id,
        membro: p.user.name,
        role: p.user.role,
        status: p.user.accountStatus,
        grupo: p.conversation.title ?? p.conversation.id.slice(0, 8),
        entrada: p.joinedAt.toISOString(),
      })),
      tabs: [
        { id: "grupos", label: "Grupos" },
        { id: "mensagens", label: "Mensagens" },
        { id: "denuncias", label: "Denúncias" },
        { id: "membros", label: "Membros" },
      ],
      disclaimer: participants.length === 0 ? "Nenhum membro em grupos internos." : undefined,
    };
  }

  const conversations = await prisma.conversation.findMany({
    where: { type: "INTERNAL" },
    orderBy: { lastMessageAt: "desc" },
    take: filters.limit,
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { participants: true, messages: true } },
    },
  });

  return {
    kpis: metrics.filter((m) => m.key === "groups_active"),
    items: conversations.map((c) => ({
      id: c.id,
      nome: c.title ?? `Grupo ${c.id.slice(0, 6)}`,
      tipo: "interno",
      privacidade: c.status === "BLOCKED" ? "bloqueado" : "interno",
      dono: c.createdBy?.name ?? "—",
      membros: c._count.participants,
      mensagens: c._count.messages,
      status: c.status,
      ultimaAtividade: c.lastMessageAt?.toISOString() ?? c.createdAt.toISOString(),
      criadoEm: c.createdAt.toISOString(),
    })),
    tabs: [
      { id: "grupos", label: "Grupos" },
      { id: "mensagens", label: "Mensagens" },
      { id: "denuncias", label: "Denúncias" },
      { id: "membros", label: "Membros" },
    ],
    disclaimer:
      conversations.length === 0
        ? "Nenhum grupo interno cadastrado. Conversas INTERNAL representam grupos oficiais."
        : undefined,
  };
}

export async function getAdminLojasModule(filters: GestorFilters) {
  const metrics = await getGovernanceMetrics();
  const where = {
    ...(filters.status ? { verificationStatus: filters.status as "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED" } : {}),
    ...(filters.q
      ? {
          OR: [
            { businessName: { contains: filters.q, mode: "insensitive" as const } },
            { cnpj: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [partners, total] = await Promise.all([
    prisma.partnerProfile.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        cnpj: true,
        verificationStatus: true,
        rejectionReason: true,
        updatedAt: true,
        user: { select: { id: true, accountStatus: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.partnerProfile.count({ where }),
  ]);

  const partnerIds = partners.map((p) => p.user.id);
  const [reviews, problemOrders] = await Promise.all([
    partnerIds.length
      ? prisma.serviceReview.count({ where: { partnerId: { in: partnerIds }, moderationStatus: "VISIBLE" } })
      : 0,
    partnerIds.length
      ? prisma.order.count({ where: { partnerId: { in: partnerIds }, status: "CANCELLED" } })
      : 0,
  ]);

  return {
    kpis: [
      ...metrics.filter((m) => m.key === "stores_suspended"),
      { key: "reviews", label: "Avaliações visíveis", value: reviews },
      { key: "problem_orders", label: "Pedidos cancelados", value: problemOrders },
    ],
    items: partners.map((p) => ({
      id: p.user.id,
      loja: p.businessName,
      cnpj: p.cnpj ?? "—",
      verificacao: p.verificationStatus,
      conta: p.user.accountStatus,
      email: p.user.email,
      motivo: p.rejectionReason ?? "—",
      atualizado: p.updatedAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
    tabs: [
      { id: "todas", label: "Todas" },
      { id: "pendentes", label: "Pendentes" },
      { id: "suspensas", label: "Suspensas" },
      { id: "documentos", label: "Documentos" },
    ],
    disclaimer: partners.length === 0 ? "Nenhuma loja/parceiro encontrado." : undefined,
  };
}

export async function getAdminPerfisModule(filters: GestorFilters) {
  const pending = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          role: true,
          publicSocialProfile: { select: { displayName: true, bio: true, avatarUrl: true, visibility: true } },
        },
      },
    },
  });

  const profiles = await prisma.publicProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: filters.limit,
    include: { user: { select: { name: true, role: true, accountStatus: true } } },
  });

  return {
    kpis: [{ key: "pending", label: "Alterações pendentes", value: pending.length }],
    items: profiles.map((p) => ({
      id: p.userId,
      nome: p.displayName ?? p.user.name,
      role: p.user.role,
      bio: p.bio?.slice(0, 60) ?? "—",
      visibilidade: p.visibility,
      statusConta: p.user.accountStatus,
      atualizado: p.updatedAt.toISOString(),
    })),
    tables: [
      {
        id: "pending",
        label: "Fila de revisão de perfil",
        rows: pending.map((a) => ({
          id: a.id,
          usuario: a.requester.name,
          tipo: a.type,
          role: a.requester.role,
          criado: a.createdAt.toISOString(),
        })),
      },
    ],
    tabs: [
      { id: "fila", label: "Fila" },
      { id: "publico", label: "Dados públicos" },
      { id: "verificacao", label: "Verificação" },
      { id: "historico", label: "Histórico" },
    ],
    disclaimer: profiles.length === 0 && pending.length === 0 ? "Nenhum perfil para revisão." : undefined,
  };
}

export async function getAdminMensagensModule(filters: GestorFilters) {
  const [reports, conversations] = await Promise.all([
    prisma.messageReport.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.conversation.count({ where: { status: { in: ["OPEN", "ACTIVE", "PRIORITY"] } } }),
  ]);

  const recent = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    where: dateRangeWhere(filters),
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { name: true, role: true } },
      conversation: { select: { title: true, type: true } },
    },
  });

  return {
    kpis: [
      { key: "reports", label: "Denúncias pendentes", value: reports },
      { key: "conversations", label: "Conversas ativas", value: conversations },
    ],
    items: recent.map((m) => ({
      id: m.id,
      remetente: m.sender.name,
      role: m.sender.role,
      conversa: m.conversation.title ?? m.conversation.type,
      trecho: m.content.slice(0, 80),
      criadoEm: m.createdAt.toISOString(),
    })),
    tabs: [
      { id: "recentes", label: "Recentes" },
      { id: "denuncias", label: "Denúncias" },
      { id: "suporte", label: "Suporte" },
    ],
    disclaimer: recent.length === 0 ? "Nenhuma mensagem recente." : undefined,
    links: [{ label: "Denúncias de mensagens", href: "/dashboard/admin/messages/reports" }],
  };
}

export async function getAdminReputacaoModule(filters: GestorFilters) {
  const [productReviews, serviceReviews, hidden] = await Promise.all([
    prisma.review.count(),
    prisma.serviceReview.count(),
    prisma.serviceReview.count({ where: { moderationStatus: "HIDDEN" } }),
  ]);

  const reviews = await prisma.serviceReview.findMany({
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      moderationStatus: true,
      createdAt: true,
      user: { select: { name: true } },
      partner: { select: { name: true } },
    },
  });

  const avg = await prisma.serviceReview.aggregate({ _avg: { rating: true } });

  return {
    kpis: [
      { key: "product_reviews", label: "Avaliações produtos", value: productReviews },
      { key: "service_reviews", label: "Avaliações serviços", value: serviceReviews },
      { key: "hidden", label: "Ocultas", value: hidden },
      { key: "avg_rating", label: "Nota média serviços", value: Math.round((avg._avg.rating ?? 0) * 10) / 10 },
    ],
    items: reviews.map((r) => ({
      id: r.id,
      nota: r.rating,
      comentario: r.comment?.slice(0, 80) ?? "—",
      status: r.moderationStatus,
      avaliador: r.user.name,
      parceiro: r.partner?.name ?? "—",
      criadoEm: r.createdAt.toISOString(),
    })),
    tabs: [
      { id: "servicos", label: "Serviços" },
      { id: "produtos", label: "Produtos" },
      { id: "ongs", label: "ONGs" },
      { id: "fraudes", label: "Fraudes" },
    ],
    disclaimer: reviews.length === 0 ? "Nenhuma avaliação registrada." : undefined,
  };
}

export async function getAdminIncidentesModule(_filters: GestorFilters) {
  const store = await loadGovernanceStore();
  const securityEvents = await prisma.securityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, eventType: true, severity: true, createdAt: true, ip: true, userId: true },
  });

  const incidents =
    store.incidents.length > 0
      ? store.incidents
      : securityEvents.map((e) => ({
          id: e.id,
          type: e.eventType,
          severity: (e.severity as "low" | "medium" | "high" | "critical") ?? "medium",
          status: "aberto" as const,
          timeline: [{ at: e.createdAt.toISOString(), note: `Evento: ${e.eventType}` }],
          createdAt: e.createdAt.toISOString(),
        }));

  return {
    kpis: [
      { key: "incidents", label: "Incidentes registrados", value: incidents.length },
      {
        key: "critical",
        label: "Críticos abertos",
        value: incidents.filter((i) => i.severity === "critical" && i.status !== "resolvido").length,
        variant: "critical" as const,
      },
      { key: "security_events", label: "Eventos segurança (30)", value: securityEvents.length },
    ],
    items: incidents.map((i) => ({
      id: i.id,
      tipo: i.type,
      severidade: i.severity,
      status: i.status,
      impacto: "impact" in i ? (i.impact ?? "—") : "—",
      criadoEm: i.createdAt,
    })),
    tabs: [
      { id: "abertos", label: "Abertos" },
      { id: "timeline", label: "Timeline" },
      { id: "evidencias", label: "Evidências" },
    ],
    disclaimer:
      store.incidents.length === 0 && securityEvents.length === 0
        ? "Nenhum incidente formal. Eventos de SecurityEvent são exibidos quando existirem."
        : undefined,
  };
}

export async function getAdminGovernancaModule(filters: GestorFilters) {
  const [privacy, audit, consents] = await Promise.all([
    prisma.dataPrivacyRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count(),
    prisma.user.count({ where: { lgpdAcceptedAt: { not: null } } }),
  ]);

  const metrics = await getGovernanceMetrics();

  return {
    kpis: [
      ...metrics.filter((m) => m.key === "lgpd_pending"),
      { key: "audit_logs", label: "Logs de auditoria", value: audit },
      { key: "consents", label: "Consentimentos LGPD", value: consents },
    ],
    items: privacy.map((p) => ({
      id: p.id,
      tipo: p.type,
      status: p.status,
      titular: p.user.name,
      email: p.user.email,
      criadoEm: p.createdAt.toISOString(),
    })),
    tabs: [
      { id: "lgpd", label: "LGPD" },
      { id: "consentimentos", label: "Consentimentos" },
      { id: "termos", label: "Termos" },
      { id: "auditoria", label: "Auditoria" },
      { id: "retencao", label: "Retenção" },
    ],
    disclaimer: privacy.length === 0 ? "Nenhum pedido LGPD pendente ou recente." : undefined,
    links: [
      { label: "Pedidos LGPD (legado)", href: "/dashboard/admin/privacy-requests" },
      { label: "Auditoria completa", href: "/admin/auditoria" },
    ],
  };
}
