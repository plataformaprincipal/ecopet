import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;
  const count = await prisma.user.count();
  console.log("OK database connected, users:", count);
} catch (e) {
  console.error("FAIL", {
    name: e?.name,
    message: e?.message,
    code: e?.code,
    meta: e?.meta,
    stack: e?.stack?.split("\n").slice(0, 8).join("\n"),
  });
} finally {
  await prisma.$disconnect();
}
