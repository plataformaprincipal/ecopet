import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@ecopet/database";

export async function ensureEcopetAiUser() {
  const email = "ecopet-ai@internal.ecopet";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Assistente ECOPET",
        username: `ecopet-ai-${randomUUID().slice(0, 8)}`,
        passwordHash: await bcrypt.hash(randomUUID(), 10),
        role: "GESTOR",
        accountStatus: "ACTIVE",
      },
    });
  }
  return user;
}
