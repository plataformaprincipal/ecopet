import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const STORE_TYPE = "admin:governance:platform";

export type UserWarningRecord = {
  id: string;
  userId: string;
  type: "leve" | "media" | "grave";
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  evidence?: string;
  adminId: string;
  adminName?: string;
  createdAt: string;
  expiresAt?: string;
  status: "ativa" | "expirada" | "contestada" | "revogada";
  appealNote?: string;
};

export type IncidentRecord = {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  impact?: string;
  affectedUsers?: number;
  responsibleId?: string;
  status: "aberto" | "em_analise" | "resolvido" | "escalado";
  timeline: Array<{ at: string; note: string }>;
  evidence?: string;
  createdAt: string;
};

export type ModerationRuleRecord = {
  id: string;
  nome: string;
  gatilho: string;
  acao: string;
  ativo: boolean;
  requerRevisao: boolean;
};

type GovernanceStore = {
  warnings: UserWarningRecord[];
  incidents: IncidentRecord[];
  rules: ModerationRuleRecord[];
  tempBlocks: Record<string, { until: string; reason: string }>;
};

const DEFAULT_RULES: ModerationRuleRecord[] = [
  { id: "r1", nome: "3 denúncias graves/24h", gatilho: "reports.critical.24h >= 3", acao: "Ocultar post", ativo: true, requerRevisao: true },
  { id: "r2", nome: "5 comentários removidos", gatilho: "comments.removed >= 5", acao: "Suspender comentários 7d", ativo: true, requerRevisao: true },
  { id: "r3", nome: "Loja com reclamações", gatilho: "partner.complaints.high", acao: "Sinalizar revisão", ativo: true, requerRevisao: true },
  { id: "r4", nome: "Login suspeito", gatilho: "login.failed.suspicious", acao: "Bloquear sessão", ativo: true, requerRevisao: false },
  { id: "r5", nome: "Spam em grupo", gatilho: "group.spam.links", acao: "Limitar links", ativo: true, requerRevisao: true },
];

const EMPTY: GovernanceStore = { warnings: [], incidents: [], rules: DEFAULT_RULES, tempBlocks: {} };

export async function loadGovernanceStore(): Promise<GovernanceStore> {
  const session = await prisma.aiSession.findFirst({
    where: { type: STORE_TYPE },
    orderBy: { updatedAt: "desc" },
  });
  if (!session?.messages) return { ...EMPTY, rules: [...DEFAULT_RULES] };
  const data = session.messages as Partial<GovernanceStore>;
  return {
    warnings: data.warnings ?? [],
    incidents: data.incidents ?? [],
    rules: data.rules?.length ? data.rules : DEFAULT_RULES,
    tempBlocks: data.tempBlocks ?? {},
  };
}

export async function saveGovernanceStore(store: GovernanceStore) {
  const existing = await prisma.aiSession.findFirst({ where: { type: STORE_TYPE }, orderBy: { updatedAt: "desc" } });
  const payload = toJson(store);
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: payload } });
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.aiSession.create({ data: { userId: admin?.id ?? "platform", type: STORE_TYPE, messages: payload } });
  }
}
