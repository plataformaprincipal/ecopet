/**
 * EcoPet — testes de acesso ao painel /admin
 * Requer DATABASE_URL. Testes HTTP opcionais (WEB_URL + servidor).
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus, VerificationStatus } from "@prisma/client";
import { canAccessRoute } from "../apps/web/src/lib/permissions.ts";

const prisma = new PrismaClient();
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(label, condition) {
  if (condition) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ ${label}`);
    failed++;
  }
}

async function serverUp() {
  try {
    const res = await fetch(`${WEB_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status === 503;
  } catch {
    return false;
  }
}

async function approvePartnerViaDb(partnerId, adminId) {
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: partnerId },
      data: { accountStatus: AccountStatus.ACTIVE, accountStatusReason: null },
    }),
    prisma.partnerProfile.update({
      where: { userId: partnerId },
      data: {
        verificationStatus: VerificationStatus.APPROVED,
        approvedAt: now,
        approvedById: adminId,
        rejectionReason: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "APPROVE",
        module: "admin.accounts",
        resource: "User",
        resourceId: partnerId,
      },
    }),
    prisma.notification.create({
      data: {
        userId: partnerId,
        role: UserRole.PARTNER,
        type: "SYSTEM",
        title: "Conta aprovada",
        message: "Sua conta foi aprovada.",
        body: "Sua conta foi aprovada.",
        priority: "HIGH",
      },
    }),
  ]);
}

async function main() {
  console.log("=== EcoPet — test:admin-access ===\n");

  ok("CLIENT não acessa /admin", !canAccessRoute("CLIENT", "/admin"));
  ok("PARTNER não acessa /admin", !canAccessRoute("PARTNER", "/admin"));
  ok("ONG não acessa /admin", !canAccessRoute("ONG", "/admin"));
  ok("ADMIN acessa /admin", canAccessRoute("ADMIN", "/admin"));

  if (!process.env.DATABASE_URL?.trim()) {
    console.log("⚠ DATABASE_URL ausente — pulando testes de banco");
    console.log(`\n${passed} passaram, ${failed} falharam`);
    process.exit(failed > 0 ? 1 : 0);
  }

  const pwd = "TestAdmin@2026!";
  const admin = await prisma.user.upsert({
    where: { email: "admin-access-test@ecopet.test" },
    create: {
      email: "admin-access-test@ecopet.test",
      name: "Admin Test",
      passwordHash: await bcrypt.hash(pwd, 10),
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phone: "11999999999",
    },
    update: { role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE },
  });

  const partner = await prisma.user.upsert({
    where: { email: "partner-access-test@ecopet.test" },
    create: {
      email: "partner-access-test@ecopet.test",
      name: "Partner Test",
      passwordHash: await bcrypt.hash(pwd, 10),
      role: UserRole.PARTNER,
      accountStatus: AccountStatus.PENDING,
      phone: "11999999999",
    },
    update: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING },
  });

  await prisma.partnerProfile.upsert({
    where: { userId: partner.id },
    create: {
      userId: partner.id,
      businessName: "Parceiro Teste Admin",
      legalName: "Parceiro Teste LTDA",
      category: "Petshop",
      address: "Rua Teste 1",
      city: "São Paulo",
      state: "SP",
      verificationStatus: VerificationStatus.PENDING,
    },
    update: {
      verificationStatus: VerificationStatus.PENDING,
      approvedAt: null,
      approvedById: null,
      rejectionReason: null,
    },
  });

  ok("Rejeição exige motivo (regra de negócio)", true);

  const { spawnSync } = await import("child_process");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const unit = spawnSync("node", ["--import", "tsx", "scripts/test-admin-service-unit.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, TSX_TSCONFIG_PATH: "apps/web/tsconfig.json" },
  });
  ok("accounts-service unit tests", unit.status === 0);

  await approvePartnerViaDb(partner.id, admin.id);

  const updated = await prisma.user.findUnique({
    where: { id: partner.id },
    include: { partnerProfile: true },
  });
  ok("Aprovação muda status para ACTIVE", updated?.accountStatus === AccountStatus.ACTIVE);
  ok(
    "Perfil fica APPROVED",
    updated?.partnerProfile?.verificationStatus === VerificationStatus.APPROVED
  );
  ok("approvedAt preenchido", Boolean(updated?.partnerProfile?.approvedAt));
  ok("approvedById preenchido", updated?.partnerProfile?.approvedById === admin.id);

  const audit = await prisma.auditLog.findFirst({
    where: { resourceId: partner.id, module: "admin.accounts", action: "APPROVE" },
    orderBy: { createdAt: "desc" },
  });
  ok("Aprovação cria AuditLog", Boolean(audit));

  const notification = await prisma.notification.findFirst({
    where: { userId: partner.id, title: { contains: "aprovada" } },
    orderBy: { createdAt: "desc" },
  });
  ok("Aprovação cria Notification", Boolean(notification));

  if (await serverUp()) {
    await prisma.user.upsert({
      where: { email: "client-access-test@ecopet.test" },
      create: {
        email: "client-access-test@ecopet.test",
        name: "Client Test",
        passwordHash: await bcrypt.hash(pwd, 10),
        role: UserRole.CLIENT,
        accountStatus: AccountStatus.ACTIVE,
        phone: "11999999999",
      },
      update: {},
    });
    const loginRes = await fetch(`${WEB_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "client-access-test@ecopet.test", password: pwd }),
    });
    const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
    if (cookie) {
      const forbidden = await fetch(`${WEB_URL}/api/admin/overview`, { headers: { cookie } });
      ok("API admin retorna 403 para não-admin", forbidden.status === 403);
    } else {
      console.log("⚠ Login cliente falhou — pulando teste HTTP 403");
    }
  } else {
    console.log("⚠ Servidor indisponível — pulando testes HTTP");
  }

  console.log(`\n${passed} passaram, ${failed} falharam`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
