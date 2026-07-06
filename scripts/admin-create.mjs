#!/usr/bin/env node
/**
 * Promove um usuário existente a ADMIN.
 * Uso: npm run admin:create
 * Env: ADMIN_CREATE_EMAIL=admin@example.com
 */
import readline from "readline";
import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";

const prisma = new PrismaClient();

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email =
    process.env.ADMIN_CREATE_EMAIL?.trim().toLowerCase() ||
    (await prompt("E-mail do usuário a promover para ADMIN: "));

  if (!email) {
    console.error("✗ E-mail é obrigatório.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✗ Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  if (user.role === UserRole.ADMIN && user.accountStatus === AccountStatus.ACTIVE) {
    console.log(`✓ ${email} já é ADMIN ativo.`);
    console.log("  Acesse: /admin");
    process.exit(0);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        accountStatusReason: null,
      },
    });

    const existingProfile = await tx.adminProfile.findUnique({ where: { userId: user.id } });
    if (!existingProfile) {
      await tx.adminProfile.create({
        data: {
          userId: user.id,
          jobTitle: "Administrador",
          accessLevel: "FULL",
          corporateEmail: email,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE",
        module: "admin.create",
        resource: "User",
        resourceId: user.id,
        observation: `Usuário promovido a ADMIN via npm run admin:create (${email})`,
        metadata: { previousRole: user.role, previousStatus: user.accountStatus },
      },
    });
  });

  console.log(`✓ ${email} promovido a ADMIN (status ACTIVE).`);
  console.log("  Faça login e acesse: /admin");
  console.log("  Produção: https://ecopet-web.vercel.app/admin");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
