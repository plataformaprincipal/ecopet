import type { PrismaClient } from "@prisma/client";

const PERMISSIONS = [
  { module: "gestor", resource: "dashboard", action: "view", code: "gestor.dashboard.view" },
  { module: "gestor", resource: "approvals", action: "view", code: "gestor.approvals.view" },
  { module: "gestor", resource: "approvals", action: "approve", code: "gestor.approvals.approve" },
  { module: "gestor", resource: "moderation", action: "view", code: "gestor.moderation.view" },
  { module: "gestor", resource: "moderation", action: "edit", code: "gestor.moderation.edit" },
  { module: "gestor", resource: "support", action: "view", code: "gestor.support.view" },
  { module: "gestor", resource: "support", action: "edit", code: "gestor.support.edit" },
  { module: "gestor", resource: "audit", action: "view", code: "gestor.audit.view" },
  { module: "gestor", resource: "audit", action: "export", code: "gestor.audit.export" },
  { module: "gestor", resource: "permissions", action: "view", code: "gestor.permissions.view" },
  { module: "gestor", resource: "permissions", action: "admin", code: "gestor.permissions.admin" },
  { module: "gestor", resource: "finance", action: "view", code: "gestor.finance.view" },
  { module: "gestor", resource: "finance", action: "edit", code: "gestor.finance.edit" },
  { module: "gestor", resource: "marketing", action: "view", code: "gestor.marketing.view" },
  { module: "gestor", resource: "marketplace", action: "view", code: "gestor.marketplace.view" },
  { module: "gestor", resource: "marketplace", action: "edit", code: "gestor.marketplace.edit" },
  { module: "gestor", resource: "integrations", action: "view", code: "gestor.integrations.view" },
  { module: "gestor", resource: "integrations", action: "configure", code: "gestor.integrations.configure" },
  { module: "gestor", resource: "quality", action: "view", code: "gestor.quality.view" },
  { module: "gestor", resource: "rh", action: "view", code: "gestor.rh.view" },
  { module: "gestor", resource: "legal", action: "view", code: "gestor.legal.view" },
  { module: "gestor", resource: "ti", action: "admin", code: "gestor.ti.admin" },
  { module: "wallet", resource: "balance", action: "view", code: "wallet.balance.view" },
  { module: "wallet", resource: "statement", action: "view", code: "wallet.statement.view" },
  { module: "wallet", resource: "refund", action: "process", code: "wallet.refund.process" },
  { module: "wallet", resource: "admin", action: "credit", code: "wallet.admin.credit" },
  { module: "orders", resource: "checkout", action: "create", code: "orders.checkout.create" },
  { module: "orders", resource: "tracking", action: "view", code: "orders.tracking.view" },
  { module: "orders", resource: "status", action: "update", code: "orders.status.update" },
  { module: "logistics", resource: "config", action: "view", code: "logistics.config.view" },
  { module: "logistics", resource: "config", action: "edit", code: "logistics.config.edit" },
  { module: "partner", resource: "assessoria", action: "view", code: "partner.assessoria.view" },
  { module: "partner", resource: "assessoria", action: "manage", code: "partner.assessoria.manage" },
  { module: "ngo", resource: "assessoria", action: "view", code: "ngo.assessoria.view" },
  { module: "ngo", resource: "assessoria", action: "manage", code: "ngo.assessoria.manage" },
  { module: "gestor", resource: "workflow", action: "view", code: "gestor.workflow.view" },
  { module: "gestor", resource: "workflow", action: "admin", code: "gestor.workflow.admin" },
  { module: "gestor", resource: "sla", action: "view", code: "gestor.sla.view" },
  { module: "gestor", resource: "sla", action: "admin", code: "gestor.sla.admin" },
  { module: "gestor", resource: "events", action: "view", code: "gestor.events.view" },
  { module: "gestor", resource: "rules", action: "view", code: "gestor.rules.view" },
  { module: "gestor", resource: "rules", action: "admin", code: "gestor.rules.admin" },
  { module: "gestor", resource: "flags", action: "view", code: "gestor.flags.view" },
  { module: "gestor", resource: "flags", action: "admin", code: "gestor.flags.admin" },
  { module: "gestor", resource: "costs", action: "view", code: "gestor.costs.view" },
  { module: "gestor", resource: "costs", action: "admin", code: "gestor.costs.admin" },
  { module: "gestor", resource: "data", action: "view", code: "gestor.data.view" },
  { module: "gestor", resource: "data", action: "admin", code: "gestor.data.admin" },
  { module: "gestor", resource: "backup", action: "view", code: "gestor.backup.view" },
  { module: "gestor", resource: "backup", action: "admin", code: "gestor.backup.admin" },
  { module: "gestor", resource: "observability", action: "view", code: "gestor.observability.view" },
  { module: "gestor", resource: "governance", action: "view", code: "gestor.governance.view" },
  { module: "gestor", resource: "governance", action: "admin", code: "gestor.governance.admin" },
  { module: "gestor", resource: "legal", action: "edit", code: "gestor.legal.edit" },
  { module: "client", resource: "privacy", action: "view", code: "client.privacy.view" },
  { module: "partner", resource: "privacy", action: "view", code: "partner.privacy.view" },
  { module: "partner", resource: "flags", action: "view", code: "partner.flags.view" },
  { module: "ngo", resource: "privacy", action: "view", code: "ngo.privacy.view" },
];

export async function seedRbac(prisma: PrismaClient) {
  console.log("🔐 Seeding RBAC & Gestor ECOPET...");

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: p,
      create: { ...p, description: `${p.module}.${p.resource}.${p.action}` },
    });
  }

  const departments = [
    { code: "EXEC", name: "Executivo" },
    { code: "OPS", name: "Operações" },
    { code: "FIN", name: "Financeiro" },
    { code: "CONT", name: "Contábil" },
    { code: "ADM", name: "Administrativo" },
    { code: "MKT", name: "Marketing" },
    { code: "VND", name: "Vendas" },
    { code: "TI", name: "Tecnologia" },
    { code: "SUP", name: "Suporte" },
    { code: "ATD", name: "Atendimento" },
    { code: "MOD", name: "Moderação" },
    { code: "QLD", name: "Qualidade" },
    { code: "DSN", name: "Design" },
    { code: "PRJ", name: "Novos Projetos" },
    { code: "INN", name: "Inovação" },
    { code: "LAB", name: "Laboratório Experimental" },
    { code: "JUR", name: "Jurídico" },
    { code: "RH", name: "Recursos Humanos" },
    { code: "AUD", name: "Auditoria" },
    { code: "BI", name: "Dados e BI" },
    { code: "PRD", name: "Produto" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
  }

  const execDept = await prisma.department.findUnique({ where: { code: "EXEC" } });

  const superRole = await prisma.rbacRole.upsert({
    where: { code: "gestor_super" },
    update: { name: "Gestor Super Admin", hierarchyLevel: 100 },
    create: {
      name: "Gestor Super Admin",
      code: "gestor_super",
      hierarchyLevel: 100,
      departmentId: execDept?.id,
    },
  });

  const modRole = await prisma.rbacRole.upsert({
    where: { code: "gestor_moderacao" },
    update: { name: "Moderador", hierarchyLevel: 50 },
    create: {
      name: "Moderador",
      code: "gestor_moderacao",
      hierarchyLevel: 50,
      departmentId: (await prisma.department.findUnique({ where: { code: "MOD" } }))?.id,
    },
  });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superRole.id, permissionId: perm.id },
    });
  }

  const modPerms = allPerms.filter((p) =>
    p.code.includes("moderation") || p.code.includes("support") || p.code.includes("dashboard")
  );
  for (const perm of modPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: modRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: modRole.id, permissionId: perm.id },
    });
  }

  return { superRole, modRole };
}

export async function seedGestorData(prisma: PrismaClient, gestorUserId: string, tutorUserId: string) {
  const superRole = await prisma.rbacRole.findUnique({ where: { code: "gestor_super" } });
  if (superRole) {
    await prisma.userRbacAssignment.upsert({
      where: { userId_roleId: { userId: gestorUserId, roleId: superRole.id } },
      update: {},
      create: { userId: gestorUserId, roleId: superRole.id, grantedBy: gestorUserId },
    });
  }

  const existingApproval = await prisma.approvalRequest.findFirst({
    where: { entityId: gestorUserId, type: "PARTNER" },
  });
  if (!existingApproval) {
    await prisma.approvalRequest.create({
      data: {
        type: "PARTNER",
        entityType: "User",
        entityId: gestorUserId,
        requesterId: tutorUserId,
        status: "PENDING",
        aiRiskScore: 0.12,
        aiNotes: "Baixo risco — documentação completa",
      },
    });
  }

  const ticketCount = await prisma.supportTicket.count();
  if (ticketCount === 0) {
    await prisma.supportTicket.createMany({
      data: [
        {
          number: 1001,
          subject: "Dúvida sobre pedido #001",
          description: "Cliente não recebeu confirmação de pagamento",
          category: "financeiro",
          priority: "HIGH",
          requesterId: tutorUserId,
          status: "OPEN",
        },
        {
          number: 1002,
          subject: "Problema com integração WhatsApp",
          description: "Parceiro petshop não consegue sincronizar",
          category: "integracao",
          priority: "MEDIUM",
          requesterId: tutorUserId,
          status: "IN_PROGRESS",
        },
      ],
    });
  }

  await prisma.systemMetric.createMany({
    data: [
      { metricKey: "revenue_daily", value: 4520 },
      { metricKey: "users_daily", value: 34 },
      { metricKey: "engagement_rate", value: 8.4 },
    ],
  });

  const convExists = await prisma.conversation.findFirst({
    where: { title: "Suporte ECOPET", participants: { some: { userId: tutorUserId } } },
  });
  if (!convExists) {
    await prisma.conversation.create({
      data: {
        type: "CLIENT_ECOPET",
        title: "Suporte ECOPET",
        status: "OPEN",
        participants: {
          create: [{ userId: tutorUserId }, { userId: gestorUserId }],
        },
        messages: {
          create: [
            { senderId: tutorUserId, content: "Olá, preciso de ajuda com meu pedido.", type: "TEXT" },
            { senderId: gestorUserId, content: "Olá! Sou do suporte ECOPET. Como posso ajudar?", type: "TEXT" },
          ],
        },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: gestorUserId,
      action: "LOGIN",
      module: "gestor",
      resource: "session",
      metadata: { source: "seed" },
    },
  });

  const finExists = await prisma.financialAccount.findFirst();
  if (!finExists) {
    await prisma.financialAccount.createMany({
      data: [
        { code: "CAIXA", name: "Caixa ECOPET", type: "ASSET", balance: 125000 },
        { code: "REC", name: "Contas a Receber", type: "ASSET", balance: 45000 },
      ],
    });
  }

  const iotExists = await prisma.iotDevice.findFirst();
  if (!iotExists) {
    await prisma.iotDevice.create({
      data: { name: "Sensor Temperatura — Pet Shop Amigo", deviceType: "sensor", ownerType: "PARTNER", ownerId: tutorUserId, status: "online", battery: 87 },
    });
  }

  await runSystemHealthCheckInline(prisma);

  await prisma.organization.upsert({
    where: { slug: "ecopet" },
    update: {},
    create: { name: "ECOPET Platform", slug: "ecopet", type: "ECOPET" },
  });

  return { seeded: true };
}

async function runSystemHealthCheckInline(prisma: PrismaClient) {
  const exists = await prisma.systemHealthCheck.findFirst();
  if (exists) return;
  await prisma.systemHealthCheck.createMany({
    data: [
      { service: "api", status: "healthy", latencyMs: 12 },
      { service: "database", status: "healthy", latencyMs: 8 },
      { service: "ai", status: "mock" },
    ],
  });
}
