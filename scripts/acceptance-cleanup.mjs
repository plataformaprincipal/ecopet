/**
 * Limpeza segura de usuários/dados de aceitação (@test.ecopet.local).
 * Nunca deleteMany sem filtro de e-mail de teste.
 *
 * Uso: node --import tsx scripts/acceptance-cleanup.mjs
 * Flag: ACCEPTANCE_CLEANUP=1 (obrigatória)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOMAIN = "test.ecopet.local";

async function main() {
  if (process.env.ACCEPTANCE_CLEANUP !== "1") {
    console.error("Defina ACCEPTANCE_CLEANUP=1 para executar. Abortado.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    console.error("Recusado em production.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${DOMAIN}` } },
    select: { id: true, email: true },
    take: 500,
  });

  console.log(`Encontrados ${users.length} usuários @${DOMAIN}`);
  let removed = 0;
  for (const u of users) {
    try {
      // Cascades dependem do schema — delete user last after dependents where needed
      await prisma.user.delete({ where: { id: u.id } });
      removed += 1;
      console.log(`removed:${u.email}`);
    } catch (e) {
      console.warn(`skip:${u.email}`, e instanceof Error ? e.message.slice(0, 120) : "err");
    }
  }
  console.log(`Removidos: ${removed}/${users.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
