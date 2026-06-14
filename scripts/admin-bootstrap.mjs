#!/usr/bin/env node
/**
 * Bootstrap seguro do primeiro usuário ADMIN.
 * Uso: npm run admin:bootstrap
 */
import bcrypt from "bcryptjs";
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

function validatePassword(password, email, name) {
  if (password.length < 12) return "Senha deve ter ao menos 12 caracteres.";
  if (!/[A-Z]/.test(password)) return "Senha deve conter letra maiúscula.";
  if (!/[a-z]/.test(password)) return "Senha deve conter letra minúscula.";
  if (!/[0-9]/.test(password)) return "Senha deve conter número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Senha deve conter caractere especial.";
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase())) {
    return "Senha não pode conter parte do e-mail.";
  }
  if (name && password.toLowerCase().includes(name.toLowerCase().slice(0, 4))) {
    return "Senha não pode conter parte do nome.";
  }
  return null;
}

async function main() {
  const existing = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  if (existing > 0) {
    console.error("✗ Já existe usuário ADMIN. Bootstrap abortado.");
    process.exit(1);
  }

  const email =
    process.env.ECOPET_BOOTSTRAP_ADMIN_EMAIL ||
    (await prompt("E-mail do ADMIN: "));
  const name =
    process.env.ECOPET_BOOTSTRAP_ADMIN_NAME ||
    (await prompt("Nome do ADMIN: "));
  const password =
    process.env.ECOPET_BOOTSTRAP_ADMIN_PASSWORD ||
    (await prompt("Senha forte do ADMIN: "));

  if (!email || !password || !name) {
    console.error("✗ E-mail, nome e senha são obrigatórios.");
    process.exit(1);
  }

  const pwdError = validatePassword(password, email, name);
  if (pwdError) {
    console.error(`✗ ${pwdError}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: UserRole.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        phone: "0000000000",
      },
    });

    await tx.adminProfile.create({
      data: {
        userId: user.id,
        jobTitle: "Administrador",
        accessLevel: "FULL",
        corporateEmail: email.toLowerCase(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        module: "admin.bootstrap",
        resource: "User",
        resourceId: user.id,
        observation: "Bootstrap do primeiro administrador",
      },
    });

    return user;
  });

  console.log(`✓ ADMIN criado: ${admin.email} (id: ${admin.id})`);
  console.log("  Nenhuma senha foi registrada em log.");
}

main()
  .catch((e) => {
    console.error("✗", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
