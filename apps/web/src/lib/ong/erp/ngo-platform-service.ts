import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import type { AiAgentId } from "@/lib/ai/types";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import {
  buildIntegrationRows,
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  NGO_INTEGRATION_CATALOG,
  type IntegrationsStore,
} from "@/lib/integrations/erp-integration-catalog";
import { kpi } from "./types";
import { loadNgoErpStore, loadNgoAuditTrail } from "./store";

export const NGO_AUTOMATION_WORKFLOWS = [
  {
    id: "new_animal",
    nome: "Novo animal cadastrado",
    gatilho: "animal.created",
    passos: ["Criar post", "Divulgar campanha", "Notificar seguidores"],
  },
  {
    id: "donation_received",
    nome: "Nova doação recebida",
    gatilho: "donation.received",
    passos: ["Gerar recibo", "Agradecer doador", "Atualizar campanha", "Registrar financeiro"],
  },
  {
    id: "adoption_approved",
    nome: "Adoção aprovada",
    gatilho: "adoption.approved",
    passos: ["Gerar termo", "Enviar e-mail", "Acompanhamento pós-adoção", "Atualizar status do animal"],
  },
  {
    id: "critical_stock",
    nome: "Estoque crítico",
    gatilho: "stock.critical",
    passos: ["Criar alerta", "Criar campanha emergencial"],
  },
  {
    id: "campaign_closed",
    nome: "Campanha encerrada",
    gatilho: "campaign.closed",
    passos: ["Gerar prestação de contas", "Enviar agradecimento"],
  },
] as const;

export const ALL_NGO_AI_ASSISTANTS = [
  { id: "adoption", label: "Adoção", agentId: "ngo" as AiAgentId, description: "Priorizar animais, classificar candidatos e responder interessados." },
  { id: "campaign", label: "Campanha", agentId: "ngo" as AiAgentId, description: "Sugerir textos e estratégias de arrecadação." },
  { id: "finance", label: "Financeiro", agentId: "finance" as AiAgentId, description: "Relatórios, prestação de contas e projeções." },
  { id: "volunteer", label: "Voluntariado", agentId: "ngo" as AiAgentId, description: "Escalas, funções e engajamento de voluntários." },
  { id: "marketing", label: "Marketing", agentId: "marketing" as AiAgentId, description: "Posts, calendário editorial e métricas." },
  { id: "admin", label: "Administrativo", agentId: "ngo" as AiAgentId, description: "Processos, tarefas e comunicados internos." },
  { id: "welfare", label: "Bem-estar animal", agentId: "veterinarian" as AiAgentId, description: "Resumir histórico e alertas de bem-estar (sem dados clínicos sensíveis)." },
] as const;

const ASSISTANT_FUNCTIONS: Record<string, string[]> = {
  adoption: ["Priorizar animais", "Classificar candidatos", "Responder interessados"],
  campaign: ["Sugerir texto de campanha", "Sugerir melhor foto/post"],
  finance: ["Gerar relatório para doadores", "Gerar prestação de contas"],
  volunteer: ["Organizar escalas", "Sugerir funções"],
  marketing: ["Calendário editorial", "SEO local", "Métricas de engajamento"],
  admin: ["Resumir processos", "Checklist operacional"],
  welfare: ["Resumir histórico do animal", "Prever estoque crítico"],
};

function monthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getNgoIntegracoesModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore<IntegrationsStore>(ongId, "integracoes", EMPTY_INTEGRATIONS_STORE);
  const rows = buildIntegrationRows(NGO_INTEGRATION_CATALOG, store);
  const active = rows.filter((r) => r.ativo).length;
  const errors = rows.filter((r) => r.erroRecente && r.erroRecente !== "—").length;
  const audit = await loadNgoAuditTrail(ongId, "integracoes", 10);

  return {
    moduleId: "integracoes",
    title: "Integrações",
    kpis: [
      kpi("total", "Integrações", rows.length),
      kpi("active", "Ativas", active),
      kpi("pending", "Não configuradas", rows.length - rows.filter((r) => r.configurado).length, {
        variant: active < rows.length ? "warning" : "success",
      }),
      kpi("errors", "Com erro", errors, { variant: errors > 0 ? "warning" : "default" }),
      kpi("env", "Ambiente", integrationEnvironment()),
    ],
    tables: [
      { id: "integrations", label: "Integrações", rows },
      { id: "logs", label: "Logs", rows: store.logs.slice(-30).reverse() },
      { id: "webhooks", label: "Webhooks", rows: rows.filter((r) => r.webhook !== "N/A") },
      { id: "audit", label: "Auditoria", rows: audit },
    ],
    tabs: [
      { id: "integrations", label: "Integrações" },
      { id: "logs", label: "Logs" },
      { id: "webhooks", label: "Webhooks" },
    ],
    items: rows.map((r) => ({ id: r.id as string, nome: r.integracao as string, status: r.status as string })),
    disclaimer:
      "Tokens são mascarados. Use POST com action test/toggle para testar ou ativar integrações. Erros de provedor não configurado são exibidos de forma controlada.",
  };
}

export async function getNgoAutomacoesModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "automacoes", {
    reminders: [] as Array<Record<string, unknown>>,
    workflowStates: {} as Record<string, { enabled: boolean; lastRun?: string }>,
    runs: [] as Array<Record<string, unknown>>,
  });

  const [workflows, listings, donations, adoptionsApproved, campaignsClosed] = await Promise.all([
    prisma.workflowInstance.findMany({
      where: { ownerId: ongId },
      orderBy: { startedAt: "desc" },
      take: 15,
      include: { definition: { select: { name: true, triggerType: true } } },
    }),
    prisma.adoptionListing.count({ where: { ongId, createdAt: { gte: monthStart() } } }),
    loadNgoErpStore(ongId, "doacoes", { donations: [] as Array<Record<string, unknown>> }),
    prisma.adoptionRequest.count({
      where: { ongId, status: "APPROVED", updatedAt: { gte: monthStart() } },
    }),
    prisma.campaign.count({
      where: { ongId, status: "COMPLETED", updatedAt: { gte: monthStart() } },
    }),
  ]);

  const templateRows = NGO_AUTOMATION_WORKFLOWS.map((w) => {
    const state = store.workflowStates[w.id] ?? { enabled: true };
    const runs = store.runs.filter((r) => r.workflowId === w.id).length;
    return {
      id: w.id,
      workflow: w.nome,
      gatilho: w.gatilho,
      passos: w.passos.join(" → "),
      ativo: state.enabled !== false,
      execucoes: runs,
      ultimaExecucao: state.lastRun ?? "—",
    };
  });

  const triggerStats = [
    { id: "animals", evento: "Animais cadastrados (mês)", count: listings },
    { id: "donations", evento: "Doações (store)", count: donations.donations.length },
    { id: "adoptions", evento: "Adoções aprovadas (mês)", count: adoptionsApproved },
    { id: "campaigns", evento: "Campanhas encerradas (mês)", count: campaignsClosed },
  ];

  return {
    moduleId: "automacoes",
    title: "Automações",
    kpis: [
      kpi("workflows", "Workflows", NGO_AUTOMATION_WORKFLOWS.length),
      kpi("active", "Ativos", templateRows.filter((w) => w.ativo).length),
      kpi("instances", "Instâncias Prisma", workflows.length),
      kpi("reminders", "Lembretes", store.reminders.length),
      kpi("runs", "Execuções (store)", store.runs.length),
    ],
    tables: [
      { id: "templates", label: "Workflows ONG", rows: templateRows },
      {
        id: "workflows",
        label: "Instâncias (motor)",
        rows: workflows.map((w) => ({
          id: w.id,
          nome: w.definition.name,
          gatilho: w.definition.triggerType,
          status: w.status,
          inicio: w.startedAt.toISOString(),
        })),
      },
      { id: "triggers", label: "Gatilhos recentes", rows: triggerStats },
      { id: "reminders", label: "Lembretes", rows: store.reminders },
      { id: "runs", label: "Histórico de execuções", rows: store.runs.slice(-20).reverse() },
    ],
    tabs: [
      { id: "templates", label: "Workflows" },
      { id: "workflows", label: "Instâncias" },
      { id: "runs", label: "Execuções" },
    ],
    disclaimer: "Workflows são preparados para o motor de automação. Ative/desative via POST no módulo automacoes.",
  };
}

export async function getNgoMarketingModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "marketing", {
    campaigns: [] as Array<Record<string, unknown>>,
    posts: [] as Array<Record<string, unknown>>,
    emails: [] as Array<Record<string, unknown>>,
    push: [] as Array<Record<string, unknown>>,
    whatsapp: [] as Array<Record<string, unknown>>,
    events: [] as Array<Record<string, unknown>>,
    seo: [] as Array<Record<string, unknown>>,
    creatives: [] as Array<Record<string, unknown>>,
    metrics: [] as Array<Record<string, unknown>>,
  });

  const since = monthStart();
  const [posts, followers, followersPrev, likes, comments, shares, campaigns, adoptions, donationStore] =
    await Promise.all([
      prisma.socialPost.findMany({
        where: { authorId: ongId, deletedAt: null, createdAt: { gte: since } },
        include: { _count: { select: { likes: true, comments: true, shares: true } } },
      }),
      prisma.userFollow.count({ where: { followingId: ongId } }),
      prisma.userFollow.count({
        where: { followingId: ongId, createdAt: { lt: since } },
      }),
      prisma.socialPostLike.count({ where: { post: { authorId: ongId, createdAt: { gte: since } } } }),
      prisma.socialComment.count({ where: { post: { authorId: ongId, createdAt: { gte: since } } } }),
      prisma.socialPostShare.count({ where: { post: { authorId: ongId, createdAt: { gte: since } } } }),
      prisma.campaign.findMany({
        where: { ongId },
        select: { id: true, title: true, status: true, raisedAmount: true, goalAmount: true },
        take: 20,
      }),
      prisma.adoptionRequest.count({
        where: { ongId, status: "APPROVED", updatedAt: { gte: since } },
      }),
      loadNgoErpStore(ongId, "doacoes", { donations: [] as Array<Record<string, unknown>> }),
    ]);

  const reach = posts.length + likes + comments + shares;
  const engagement = posts.length > 0 ? Math.round(((likes + comments) / posts.length) * 10) / 10 : 0;
  const clicks = shares + store.posts.length;
  const donationsMonth = donationStore.donations.filter(
    (d) => d.status === "recebida" && d.data && new Date(String(d.data)) >= since
  ).length;
  const followerGrowth =
    followersPrev > 0 ? Math.round(((followers - followersPrev) / followersPrev) * 100) : followers > 0 ? 100 : 0;
  const conversionCampaign =
    campaigns.length > 0 ? Math.round((donationsMonth / Math.max(campaigns.filter((c) => c.status === "ACTIVE").length, 1)) * 100) / 100 : 0;

  const editorialCalendar =
    store.posts.length > 0
      ? store.posts
      : posts.slice(0, 15).map((p) => ({
          id: p.id,
          titulo: p.content.slice(0, 60),
          data: p.createdAt.toISOString(),
          curtidas: p._count.likes,
          comentarios: p._count.comments,
        }));

  return {
    moduleId: "marketing",
    title: "Marketing ONG",
    kpis: [
      kpi("reach", "Alcance (est.)", reach),
      kpi("engagement", "Engajamento/post", engagement),
      kpi("clicks", "Cliques/compart.", clicks),
      kpi("donations", "Doações geradas", donationsMonth),
      kpi("adoptions", "Adoções geradas", adoptions),
      kpi("conversion", "Conversão/campanha", conversionCampaign),
      kpi("followers", "Seguidores", followers, { delta: followerGrowth }),
    ],
    tables: [
      { id: "campaigns", label: "Campanhas", rows: campaigns.map((c) => ({ ...c, titulo: c.title })) },
      { id: "posts", label: "Posts", rows: editorialCalendar },
      { id: "emails", label: "E-mails", rows: store.emails },
      { id: "push", label: "Push", rows: store.push },
      { id: "whatsapp", label: "WhatsApp", rows: store.whatsapp },
      { id: "events", label: "Eventos", rows: store.events },
      { id: "seo", label: "SEO local", rows: store.seo },
      { id: "social", label: "Mídia social", rows: posts.slice(0, 10).map((p) => ({ id: p.id, conteudo: p.content.slice(0, 80) })) },
      { id: "editorial", label: "Calendário editorial", rows: editorialCalendar },
      { id: "creatives", label: "Criativos", rows: store.creatives },
      { id: "metrics", label: "Métricas", rows: store.metrics },
    ],
    tabs: [
      { id: "campaigns", label: "Campanhas" },
      { id: "posts", label: "Posts" },
      { id: "emails", label: "E-mails" },
      { id: "events", label: "Eventos" },
      { id: "editorial", label: "Calendário" },
      { id: "metrics", label: "Métricas" },
    ],
    quickActions: [
      { label: "Rede social", href: "/ngo/social" },
      { label: "Campanhas", href: "/ngo/campanhas" },
      { label: "EccoPet IA", href: "/ngo/eccopet" },
    ],
  };
}

export async function getNgoIaModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const configured = isAIProviderConfigured();
  const [aiLogs, aiConversations] = await Promise.all([
    prisma.aILog.findMany({
      where: { userId: ongId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, agentId: true, errorCode: true, durationMs: true, createdAt: true },
    }),
    prisma.aIConversation.findMany({
      where: { userId: ongId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);

  const functionRows = ALL_NGO_AI_ASSISTANTS.flatMap((a) =>
    (ASSISTANT_FUNCTIONS[a.id] ?? []).map((fn, i) => ({
      id: `${a.id}-${i}`,
      assistente: a.label,
      funcao: fn,
    }))
  );

  return {
    moduleId: "ia",
    title: "Inteligência Artificial ONG",
    kpis: [
      kpi("assistants", "Assistentes", ALL_NGO_AI_ASSISTANTS.length),
      kpi("conversations", "Conversas", aiConversations.length),
      kpi("logs", "Execuções IA", aiLogs.length),
      kpi("status", "Provedor", configured ? "Configurado" : "Pendente", {
        variant: configured ? "success" : "warning",
      }),
    ],
    items: ALL_NGO_AI_ASSISTANTS.map((a) => ({
      id: a.id,
      nome: a.label,
      agentId: a.agentId,
      descricao: a.description,
      endpoint: "/api/ong/erp/ia/chat",
    })),
    tables: [
      {
        id: "assistants",
        label: "Assistentes disponíveis",
        rows: ALL_NGO_AI_ASSISTANTS.map((a) => ({
          id: a.id,
          assistente: a.label,
          agente: a.agentId,
          descricao: a.description,
        })),
      },
      { id: "functions", label: "Funções IA", rows: functionRows },
      {
        id: "conversations",
        label: "Conversas recentes",
        rows: aiConversations.map((c) => ({
          id: c.id,
          titulo: c.title ?? "Conversa",
          atualizado: c.updatedAt.toISOString(),
        })),
      },
      {
        id: "logs",
        label: "Logs de IA",
        rows: aiLogs.map((l) => ({
          id: l.id,
          agente: l.agentId,
          status: l.errorCode ? "erro" : "ok",
          latencia: l.durationMs,
          data: l.createdAt.toISOString(),
        })),
      },
    ],
    quickActions: ALL_NGO_AI_ASSISTANTS.map((a) => ({
      label: a.label,
      href: `/ngo/eccopet?assistant=${a.id}`,
    })),
    disclaimer: configured
      ? "Toda IA utiliza o AI Orchestrator. Dados de adotantes e documentos privados não são expostos ao modelo."
      : "IA ainda não configurada. Configure OPENAI_API_KEY ou provedor equivalente.",
    aiConfigured: configured,
  };
}
