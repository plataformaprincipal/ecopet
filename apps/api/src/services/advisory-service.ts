import { prisma } from "@ecopet/database";
import type { AdvisoryPlanType, RobotDomain } from "@prisma/client";
import { createAuditLog } from "./audit-service.js";

const PARTNER_ROLES = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER"];

const PARTNER_ROBOTS: { domain: RobotDomain; name: string; description: string }[] = [
  { domain: "FINANCE", name: "Robô Financeiro", description: "Fluxo de caixa, margens e projeções" },
  { domain: "COMMERCIAL", name: "Robô Comercial", description: "Vendas, leads e conversão" },
  { domain: "STOCK", name: "Robô Estoque", description: "Níveis, reposição e alertas" },
  { domain: "PRODUCTION", name: "Robô Produção", description: "Capacidade e eficiência produtiva" },
  { domain: "LOGISTICS", name: "Robô Logística", description: "Entregas, prazos e custos" },
  { domain: "HR", name: "Robô RH", description: "Equipe, produtividade e turnover" },
  { domain: "QUALITY", name: "Robô Qualidade", description: "SLA, reclamações e devoluções" },
  { domain: "LEGAL", name: "Robô Jurídico", description: "Compliance e contratos" },
  { domain: "MARKETING", name: "Robô Marketing", description: "Campanhas e ROI" },
  { domain: "AI", name: "Robô Inovação", description: "Tendências e oportunidades" },
  { domain: "AGROPET", name: "Robô AgroPet", description: "Produção rural integrada" },
];

const NGO_ROBOTS: { domain: RobotDomain; name: string; description: string }[] = [
  { domain: "CAMPAIGNS", name: "Robô Campanhas", description: "Campanhas sociais e alcance" },
  { domain: "DONATIONS", name: "Robô Doações", description: "Arrecadação e metas" },
  { domain: "PETS", name: "Robô Adoções", description: "Processo de adoção" },
  { domain: "RESCUE", name: "Robô Resgates", description: "Resgates urgentes" },
  { domain: "PROJECTS", name: "Robô Projetos", description: "Cronogramas e entregas" },
  { domain: "HR", name: "Robô Voluntários", description: "Engajamento voluntário" },
  { domain: "FINANCE", name: "Robô Financeiro Social", description: "Transparência financeira" },
];

export function isAdvisoryEligible(role: string) {
  return PARTNER_ROLES.includes(role) || role === "ONG";
}

export async function getOrCreateSubscription(userId: string, role: string) {
  if (!isAdvisoryEligible(role)) throw new Error("Assessoria disponível apenas para Parceiros e ONGs");

  const planType: AdvisoryPlanType = role === "ONG" ? "NGO_SOCIAL" : "PARTNER_BUSINESS";
  let sub = await prisma.advisorySubscription.findUnique({
    where: { userId },
    include: { metrics: { orderBy: { recordedAt: "desc" }, take: 20 }, insights: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  if (!sub) {
    sub = await prisma.advisorySubscription.create({
      data: {
        userId,
        planType,
        active: true,
        features: { iot: true, robots: true, analytics: true, ai: true },
      },
      include: { metrics: true, insights: true },
    });
  }
  return sub;
}

export async function getAdvisoryDashboard(userId: string, role: string) {
  const sub = await getOrCreateSubscription(userId, role);
  const robots = role === "ONG" ? NGO_ROBOTS : PARTNER_ROBOTS;

  const operationalRobots = await prisma.operationalRobot.findMany({
    where: { ownerId: userId, isActive: true },
    take: 10,
  });

  const cards = sub.metrics.length
    ? sub.metrics.slice(0, 8).map((m) => ({
        key: m.metricKey,
        label: m.label,
        value: m.value,
        trend: m.trend,
      }))
    : generateDefaultMetrics(role);

  return {
    subscription: sub,
    robots: robots.map((r) => ({
      ...r,
      status: operationalRobots.find((o) => o.domain === r.domain)?.isActive ? "online" : "ready",
    })),
    cards,
    planType: sub.planType,
  };
}

function generateDefaultMetrics(role: string) {
  if (role === "ONG") {
    return [
      { key: "campaigns", label: "Campanhas ativas", value: 4, trend: "+12%" },
      { key: "donations", label: "Arrecadação (R$)", value: 28500, trend: "+8%" },
      { key: "volunteers", label: "Voluntários", value: 42, trend: "+5%" },
      { key: "adoptions", label: "Adoções 2026", value: 18, trend: "+22%" },
      { key: "rescues", label: "Resgates", value: 31, trend: "stable" },
      { key: "impact", label: "Alcance social", value: 12500, trend: "+15%" },
      { key: "quality", label: "Transparência", value: 94, trend: "+2%" },
      { key: "efficiency", label: "Eficiência operacional", value: 87, trend: "+3%" },
    ];
  }
  return [
    { key: "revenue", label: "Receita mensal (R$)", value: 45200, trend: "+14%" },
    { key: "productivity", label: "Produtividade", value: 91, trend: "+5%" },
    { key: "quality", label: "Qualidade (NPS)", value: 88, trend: "+2%" },
    { key: "growth", label: "Crescimento", value: 12, trend: "+12%" },
    { key: "risk", label: "Índice de risco", value: 18, trend: "-3%" },
    { key: "efficiency", label: "Eficiência", value: 85, trend: "+4%" },
    { key: "savings", label: "Economia (R$)", value: 3200, trend: "+7%" },
    { key: "logistics", label: "SLA logística", value: 96, trend: "+1%" },
  ];
}

export async function seedAdvisoryMetrics(subscriptionId: string, role: string) {
  const defaults = generateDefaultMetrics(role);
  for (const m of defaults) {
    const existing = await prisma.advisoryMetric.findFirst({
      where: { subscriptionId, metricKey: m.key },
    });
    if (existing) {
      await prisma.advisoryMetric.update({
        where: { id: existing.id },
        data: { value: m.value, trend: m.trend, label: m.label },
      });
    } else {
      await prisma.advisoryMetric.create({
        data: {
          subscriptionId,
          metricKey: m.key,
          value: m.value,
          label: m.label,
          trend: m.trend,
        },
      });
    }
  }
}

export async function generateAdvisoryInsights(userId: string, role: string) {
  const sub = await getOrCreateSubscription(userId, role);
  const isNgo = role === "ONG";

  const insights = isNgo
    ? [
        { category: "campanhas", title: "Campanha de adoção com baixo engajamento", description: "A campanha 'Adote um Amigo' teve 23% menos cliques. Sugestão: reforçar stories e parcerias locais.", priority: "high" },
        { category: "doacoes", title: "Meta de arrecadação em risco", description: "Com o ritmo atual, a meta mensal será atingida em 78%. Ative lembrete para doadores recorrentes.", priority: "medium" },
        { category: "voluntarios", title: "Gap de voluntários no fim de semana", description: "Sábados têm 40% menos cobertura. Robô Voluntários sugere campanha de recrutamento.", priority: "medium" },
        { category: "impacto", title: "Impacto social crescente", description: "Alcance +15% vs mês anterior. Destaque resultados no feed para atrair novos apoiadores.", priority: "low" },
      ]
    : [
        { category: "financeiro", title: "Margem em queda no segmento premium", description: "Produtos premium tiveram margem 8% menor. Revise precificação ou negocie com fornecedores.", priority: "high" },
        { category: "estoque", title: "Ruptura prevista em 5 SKUs", description: "Robô Estoque identificou itens com estoque < 7 dias. Reabastecer ração premium e antipulgas.", priority: "high" },
        { category: "logistica", title: "Atrasos em entregas regionais", description: "SLA regional caiu para 89%. Considere parceiro logístico alternativo.", priority: "medium" },
        { category: "comercial", title: "Oportunidade de upsell", description: "42% dos clientes de banho também compram produtos. Crie combo promocional.", priority: "low" },
      ];

  const created = [];
  for (const ins of insights) {
    const row = await prisma.advisoryInsight.create({
      data: {
        subscriptionId: sub.id,
        category: ins.category,
        title: ins.title,
        description: ins.description,
        priority: ins.priority,
        aiGenerated: true,
        actionPlan: { steps: ["Analisar dados", "Definir responsável", "Executar em 7 dias"], robot: ins.category },
      },
    });
    created.push(row);
  }

  await createAuditLog({
    userId,
    action: "CREATE",
    module: "advisory",
    resource: "insights",
    metadata: { count: created.length, planType: sub.planType },
  });

  await prisma.systemMetric.create({
    data: { metricKey: "advisory.insights_generated", value: created.length, metadata: { userId } },
  });

  return created;
}

export async function getMarketplaceAdvisoryServices() {
  return [
    { id: "adv-consultoria", name: "Consultoria Empresarial", category: "Assessoria ECOPET", price: 499 },
    { id: "adv-social", name: "Consultoria Social", category: "Assessoria ECOPET", price: 399 },
    { id: "adv-auditoria", name: "Auditoria Operacional", category: "Assessoria ECOPET", price: 799 },
    { id: "adv-qualidade", name: "Qualidade & SLA", category: "Assessoria ECOPET", price: 349 },
    { id: "adv-automacao", name: "Automação & Robôs", category: "Assessoria ECOPET", price: 599 },
    { id: "adv-ia", name: "IA Empresarial", category: "Assessoria ECOPET", price: 449 },
    { id: "adv-iot", name: "IoT & Monitoramento", category: "Assessoria ECOPET", price: 549 },
    { id: "adv-agropet", name: "Assessoria AgroPet", category: "Assessoria ECOPET", price: 699 },
    { id: "adv-inovacao", name: "Inovação & Tendências", category: "Assessoria ECOPET", price: 399 },
  ];
}
