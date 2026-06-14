/**
 * Tokens de sessão: access JWT (curto) + refresh opaco (persistido em UserSession).
 */
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "@ecopet/database";

const JWT_SECRET = process.env.JWT_SECRET || "ecopet-dev-secret";
const ACCESS_EXPIRY: SignOptions["expiresIn"] = (process.env.JWT_ACCESS_EXPIRY || "15m") as SignOptions["expiresIn"];
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS || 7);

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUserSessionTokens(params: {
  userId: string;
  role: string;
  ip?: string;
  userAgent?: string;
}) {
  const accessToken = jwt.sign(
    { userId: params.userId, role: params.role, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(48).toString("hex");
  const refreshHash = hashToken(refreshToken);

  await prisma.userSession.create({
    data: {
      userId: params.userId,
      tokenHash: refreshHash,
      ip: params.ip,
      userAgent: params.userAgent,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  const refreshHash = hashToken(refreshToken);
  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash: refreshHash,
      active: true,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { id: true, role: true, accountStatus: true } } },
  });

  if (!session?.user) return null;

  const accessToken = jwt.sign(
    { userId: session.user.id, role: session.user.role, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return { accessToken, userId: session.user.id, role: session.user.role };
}

export async function revokeRefreshToken(refreshToken: string) {
  const refreshHash = hashToken(refreshToken);
  await prisma.userSession.updateMany({
    where: { tokenHash: refreshHash, active: true },
    data: { active: false },
  });
}

export { hashToken };
