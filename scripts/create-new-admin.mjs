#!/usr/bin/env node
/**
 * Cria/atualiza administrador FULL e remove ADMIN do usuário anterior.
 * Uso: npm run admin:create-new
 *
 * Requer DATABASE_URL no ambiente (.env na raiz).
 */
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_ADMIN_EMAIL = "assessoriaplatine@gmail.com";
const NEW_ADMIN_PASSWORD = "ECOcabo@2020";
const NEW_ADMIN_NAME = "Administrador EcoPet";

const PREVIOUS_ADMIN_EMAIL = "arthuralves2307@gmail.com";

async function upsertNewAdmin(tx) {
  const email = NEW_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(NEW_ADMIN_PASSWORD, 12);

  const existing = await tx.user.findUnique({ where: { email } });

  const user = existing
    ? await tx.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.ADMIN,
          accountStatus: AccountStatus.ACTIVE,
          accountStatusReason: null,
          passwordHash,
          passwordChangedAt: new Date(),
        },
      })
    : await tx.user.create({
        data: {
          email,
          name: NEW_ADMIN_NAME,
          passwordHash,
          role: UserRole.ADMIN,
          accountStatus: AccountStatus.ACTIVE,
          phone: "0000000000",
          passwordChangedAt: new Date(),
        },
      });

  await tx.adminProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      jobTitle: "Administrador",
      accessLevel: "FULL",
      corporateEmail: email,
    },
    update: {
      jobTitle: "Administrador",
      accessLevel: "FULL",
      corporateEmail: email,
    },
  });

  await tx.auditLog.create({
    data: {
      userId: user.id,
      action: existing ? "UPDATE" : "CREATE",
      module: "admin.create-new",
      resource: "User",
      resourceId: user.id,
      observation: existing
        ? `Administrador FULL atualizado via admin:create-new (${email})`
        : `Administrador FULL criado via admin:create-new (${email})`,
    },
  });

  return { user, created: !existing };
}

async function demotePreviousAdmin(tx) {
  const email = PREVIOUS_ADMIN_EMAIL.toLowerCase();
  const previous = await tx.user.findUnique({ where: { email } });

  if (!previous) {
    return { found: false, demoted: false };
  }

  if (previous.role !== UserRole.ADMIN) {
    await tx.adminProfile.deleteMany({ where: { userId: previous.id } });
    return { found: true, demoted: false, alreadyClient: true };
  }

  await tx.adminProfile.deleteMany({ where: { userId: previous.id } });

  await tx.user.update({
    where: { id: previous.id },
    data: {
      role: UserRole.CLIENT,
      accountStatus: AccountStatus.ACTIVE,
      accountStatusReason: null,
    },
  });

  await tx.auditLog.create({
    data: {
      userId: previous.id,
      action: "UPDATE",
      module: "admin.create-new",
      resource: "User",
      resourceId: previous.id,
      observation: `Acesso ADMIN removido via admin:create-new; role alterado para CLIENT (${email})`,
      metadata: { previousRole: UserRole.ADMIN, newRole: UserRole.CLIENT },
    },
  });

  return { found: true, demoted: true };
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("✗ DATABASE_URL não configurada. Defina no .env antes de executar.");
    process.exit(1);
  }

  const result = await prisma.$transaction(async (tx) => {
    const newAdmin = await upsertNewAdmin(tx);
    const previous = await demotePreviousAdmin(tx);
    return { newAdmin, previous };
  });

  const { user, created } = result.newAdmin;
  const profile = await prisma.adminProfile.findUnique({ where: { userId: user.id } });

  console.log("=== EcoPet — admin:create-new ===\n");
  console.log(created ? "✓ Novo administrador criado" : "✓ Administrador existente atualizado");
  console.log(`  E-mail: ${user.email}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Status: ${user.accountStatus}`);
  console.log(`  AdminProfile: accessLevel=${profile?.accessLevel ?? "—"}`);
  console.log("");
  console.log("✓ Acesso ao painel: https://ecopet-web.vercel.app/admin");
  console.log(`  Login: ${NEW_ADMIN_EMAIL}`);
  console.log("  Senha: (configurada no script — não exibida em log)");
  console.log("");

  if (!result.previous.found) {
    console.log(`⚠ Usuário anterior não encontrado: ${PREVIOUS_ADMIN_EMAIL}`);
  } else if (result.previous.alreadyClient) {
    console.log(`✓ ${PREVIOUS_ADMIN_EMAIL} já não era ADMIN (AdminProfile removido se existia)`);
  } else if (result.previous.demoted) {
    console.log(`✓ ${PREVIOUS_ADMIN_EMAIL} deixou de ser ADMIN → role CLIENT, status ACTIVE`);
    console.log("  AdminProfile removido");
  }

  console.log("\n✓ Concluído. Faça login com o novo administrador para acessar /admin.");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
