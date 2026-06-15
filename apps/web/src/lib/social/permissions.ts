import { AccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SocialError } from "@/lib/social/errors";
import { SOCIAL_ALLOWED_POST_ROLES } from "@/lib/social/constants";

export type SocialUser = {
  id: string;
  role: UserRole;
  accountStatus: AccountStatus;
  name: string;
  email: string;
};

export async function requireSocialUser(userId: string): Promise<SocialUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountStatus: true, name: true, email: true },
  });
  if (!user) throw new SocialError("Usuário não encontrado.", "NOT_FOUND", 404);
  if (user.accountStatus === "SUSPENDED") {
    throw new SocialError("Conta suspensa.", "ACCOUNT_SUSPENDED", 403);
  }
  if (user.accountStatus === "REJECTED") {
    throw new SocialError("Conta rejeitada.", "ACCOUNT_REJECTED", 403);
  }
  return user;
}

export async function requireActiveSocialUser(userId: string): Promise<SocialUser> {
  const user = await requireSocialUser(userId);
  if (user.accountStatus !== "ACTIVE") {
    throw new SocialError("Conta precisa estar ativa para interagir no feed.", "ACCOUNT_NOT_ACTIVE", 403);
  }
  return user;
}

export async function requireSocialPoster(userId: string): Promise<SocialUser> {
  const user = await requireActiveSocialUser(userId);
  if (!SOCIAL_ALLOWED_POST_ROLES.includes(user.role as (typeof SOCIAL_ALLOWED_POST_ROLES)[number])) {
    throw new SocialError("Seu perfil não pode publicar no feed.", "FORBIDDEN", 403);
  }
  return user;
}

export async function assertNotBlocked(userA: string, userB: string) {
  if (userA === userB) return;
  const block = await prisma.userSocialBlock.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });
  if (block) {
    throw new SocialError("Interação bloqueada entre usuários.", "USER_BLOCKED", 403);
  }
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.userSocialBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === userId) ids.add(b.blockedId);
    else ids.add(b.blockerId);
  }
  return [...ids];
}

export async function requireAdmin(userId: string): Promise<SocialUser> {
  const user = await requireSocialUser(userId);
  if (user.role !== "ADMIN") {
    throw new SocialError("Acesso restrito a administradores.", "FORBIDDEN", 403);
  }
  return user;
}
