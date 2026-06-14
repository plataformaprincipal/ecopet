/**
 * Limpa usuários de teste e sessões — apenas desenvolvimento.
 * Bloqueado quando NODE_ENV=production.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER_WHERE = {
  OR: [
    { email: { endsWith: "@ecopet.test" } },
    { email: { endsWith: "@t.test" } },
    { email: { startsWith: "test." } },
    { email: { startsWith: "flow.test." } },
    { email: { startsWith: "diag." } },
    { email: { startsWith: "fix.port." } },
    { email: { startsWith: "dup." } },
    { email: { startsWith: "ps." } },
    { email: { startsWith: "ong." } },
    { email: { startsWith: "tutor." } },
  ],
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ db:reset:dev bloqueado em produção (NODE_ENV=production).");
    process.exit(1);
  }

  const testUsers = await prisma.user.findMany({
    where: TEST_USER_WHERE,
    select: { id: true, email: true },
  });

  const deletedSessions = await prisma.userSession.deleteMany();
  const deletedLoginLogs = await prisma.loginLog.deleteMany({
    where: testUsers.length ? { userId: { in: testUsers.map((u) => u.id) } } : undefined,
  });

  let deletedUsers = { count: 0 };
  if (testUsers.length) {
    deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: testUsers.map((u) => u.id) } },
    });
  }

  console.log(`✓ Sessões removidas: ${deletedSessions.count}`);
  console.log(`✓ Logs de login removidos: ${deletedLoginLogs.count}`);
  console.log(`✓ Usuários de teste removidos: ${deletedUsers.count}`);
  if (testUsers.length) {
    console.log("  E-mails removidos:");
    for (const u of testUsers) console.log(`  - ${u.email}`);
  } else {
    console.log("  Nenhum usuário de teste encontrado.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
