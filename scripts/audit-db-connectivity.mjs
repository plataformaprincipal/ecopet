import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const started = Date.now();
  const count = await prisma.user.count();
  const sample = await prisma.user.findFirst({ select: { id: true, email: true, role: true } });
  console.log(JSON.stringify({ ok: true, userCount: count, sampleUser: sample, ms: Date.now() - started }, null, 2));
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ ok: false, error: e.message, code: e.code }, null, 2));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
