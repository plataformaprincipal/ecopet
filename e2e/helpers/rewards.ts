import bcrypt from "bcryptjs";
import { AccountStatus, PrismaClient, UserRole } from "@prisma/client";
import { TEST_PASSWORD, testEmail } from "./acceptance";
import { loadWebRuntimeEnv } from "./load-web-env";

loadWebRuntimeEnv();

const prisma = new PrismaClient({
  datasources: process.env.DATABASE_URL ? { db: { url: process.env.DATABASE_URL } } : undefined,
});

export async function clearAuthRateLimitBuckets() {
  await prisma.rateLimitBucket.deleteMany({ where: { id: { startsWith: "login:" } } }).catch(() => undefined);
  await prisma.rateLimitBucket.deleteMany({ where: { id: { startsWith: "register:" } } }).catch(() => undefined);
}

export async function createClientUser(label: string) {
  const tag = `${label}${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/[^a-z0-9]/gi, "").slice(0, 18);
  const email = testEmail("client", tag);
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: `ACC Cliente ${tag}`,
      passwordHash: hash,
      role: UserRole.CLIENT,
      accountStatus: AccountStatus.ACTIVE,
      phone: `+55118${String(Math.floor(Math.random() * 90_000_000) + 10_000_000)}`,
      username: `u${tag}`.slice(0, 20).toLowerCase(),
      birthDate: new Date("1990-03-10"),
      gender: "MASCULINO",
      termsAcceptedAt: new Date(),
      lgpdAcceptedAt: new Date(),
    },
  });
  return { id: user.id, email, name: user.name };
}

export async function creditEccoPontos(userId: string, points: number, description: string) {
  const account = await prisma.loyaltyAccount.upsert({
    where: { userId },
    create: {
      userId,
      pointsBalance: points,
      lifetimePoints: points,
      updatedAt: new Date(),
    },
    update: {
      pointsBalance: { increment: points },
      lifetimePoints: { increment: points },
    },
  });
  await prisma.loyaltyTransaction.create({
    data: {
      loyaltyAccountId: account.id,
      type: "EARN",
      points,
      sourceType: "ORDER",
      sourceId: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description,
    },
  });
  return prisma.loyaltyAccount.findUniqueOrThrow({ where: { id: account.id } });
}

export async function upsertTestReward(params: {
  code: string;
  title: string;
  pointsCost: number;
  discountValue?: number;
}) {
  return prisma.loyaltyReward.upsert({
    where: { code: params.code },
    create: {
      code: params.code,
      title: params.title,
      description: params.title,
      pointsCost: params.pointsCost,
      couponDiscountType: "PERCENT",
      couponDiscountValue: params.discountValue ?? 10,
      isActive: true,
    },
    update: {
      title: params.title,
      pointsCost: params.pointsCost,
      isActive: true,
    },
  });
}

export async function disconnectRewardsPrisma() {
  await prisma.$disconnect().catch(() => undefined);
}
