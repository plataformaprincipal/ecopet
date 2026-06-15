import { prisma } from "@/lib/prisma";
import { SocialError } from "@/lib/social/errors";
import { requireActiveSocialUser, assertNotBlocked } from "@/lib/social/permissions";
import { SOCIAL_ROLE_LABELS } from "@/lib/social/constants";
import { listFeed } from "@/lib/social/posts";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { SOCIAL_RATE_LIMITS } from "@/lib/social/constants";
import { notifyNewFollower } from "@/lib/social/notifications/social-notification-service";

export async function getOrCreatePublicProfile(userId: string) {
  let profile = await prisma.publicProfile.findUnique({ where: { userId } });
  if (!profile) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, bio: true, avatar: true, avatarUrl: true },
    });
    if (!user) throw new SocialError("Usuário não encontrado.", "NOT_FOUND", 404);
    profile = await prisma.publicProfile.create({
      data: {
        userId,
        displayName: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl ?? user.avatar,
      },
    });
  }
  return profile;
}

export async function getPublicProfile(userId: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, accountStatus: true, avatar: true, avatarUrl: true, bio: true },
  });
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "REJECTED") {
    throw new SocialError("Perfil não encontrado.", "NOT_FOUND", 404);
  }

  if (viewerId) await assertNotBlocked(viewerId, userId);

  const profile = await getOrCreatePublicProfile(userId);
  if (profile.visibility === "PRIVATE" && viewerId !== userId) {
    throw new SocialError("Perfil privado.", "FORBIDDEN", 403);
  }

  const [postsCount, followersCount, followingCount, isFollowing, isBlocked] = await Promise.all([
    prisma.socialPost.count({
      where: { authorId: userId, status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    }),
    prisma.userFollow.count({ where: { followingId: userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
    viewerId
      ? prisma.userFollow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
        })
      : null,
    viewerId
      ? prisma.userSocialBlock.findFirst({
          where: { OR: [{ blockerId: viewerId, blockedId: userId }, { blockerId: userId, blockedId: viewerId }] },
        })
      : null,
  ]);

  return {
    userId: user.id,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? user.avatarUrl ?? user.avatar,
    coverUrl: profile.coverUrl,
    visibility: profile.visibility,
    role: user.role,
    roleLabel: SOCIAL_ROLE_LABELS[user.role] ?? user.role,
    counts: { posts: postsCount, followers: followersCount, following: followingCount },
    viewerState: viewerId
      ? { isFollowing: Boolean(isFollowing), isBlocked: Boolean(isBlocked), isSelf: viewerId === userId }
      : undefined,
  };
}

export async function updateMyProfile(
  userId: string,
  data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string; visibility?: "PUBLIC" | "PRIVATE" }
) {
  await requireActiveSocialUser(userId);
  await getOrCreatePublicProfile(userId);

  const updated = await prisma.publicProfile.update({
    where: { userId },
    data: {
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      coverUrl: data.coverUrl,
      visibility: data.visibility,
    },
  });

  return {
    userId,
    displayName: updated.displayName,
    bio: updated.bio,
    avatarUrl: updated.avatarUrl,
    coverUrl: updated.coverUrl,
    visibility: updated.visibility,
  };
}

export async function listProfilePosts(params: {
  userId: string;
  viewerId?: string;
  cursor?: string;
  limit?: number;
}) {
  return listFeed({
    authorId: params.userId,
    viewerId: params.viewerId,
    cursor: params.cursor,
    limit: params.limit,
  });
}

export async function followUser(params: { followerId: string; followingId: string }) {
  await requireActiveSocialUser(params.followerId);
  if (params.followerId === params.followingId) {
    throw new SocialError("Você não pode seguir a si mesmo.", "VALIDATION", 400);
  }
  if (!checkSocialRateLimit(`follow:${params.followerId}`, SOCIAL_RATE_LIMITS.follow.limit, SOCIAL_RATE_LIMITS.follow.windowMs)) {
    throw new SocialError("Muitas ações de seguir em pouco tempo.", "RATE_LIMIT", 429);
  }

  await assertNotBlocked(params.followerId, params.followingId);

  const target = await prisma.user.findUnique({ where: { id: params.followingId } });
  if (!target || target.accountStatus !== "ACTIVE") {
    throw new SocialError("Usuário não encontrado.", "NOT_FOUND", 404);
  }

  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: params.followerId, followingId: params.followingId } },
    create: { followerId: params.followerId, followingId: params.followingId },
    update: {},
  });

  if (params.followingId !== params.followerId) {
    await notifyNewFollower({ followerId: params.followerId, followingId: params.followingId });
  }

  return { following: true };
}

export async function unfollowUser(params: { followerId: string; followingId: string }) {
  await requireActiveSocialUser(params.followerId);
  await prisma.userFollow.deleteMany({
    where: { followerId: params.followerId, followingId: params.followingId },
  });
  return { following: false };
}

export async function blockUser(params: { blockerId: string; blockedId: string; reason?: string }) {
  await requireActiveSocialUser(params.blockerId);
  if (params.blockerId === params.blockedId) {
    throw new SocialError("Você não pode bloquear a si mesmo.", "VALIDATION", 400);
  }

  await prisma.userSocialBlock.upsert({
    where: { blockerId_blockedId: { blockerId: params.blockerId, blockedId: params.blockedId } },
    create: { blockerId: params.blockerId, blockedId: params.blockedId, reason: params.reason },
    update: { reason: params.reason },
  });

  await prisma.userFollow.deleteMany({
    where: {
      OR: [
        { followerId: params.blockerId, followingId: params.blockedId },
        { followerId: params.blockedId, followingId: params.blockerId },
      ],
    },
  });

  return { blocked: true };
}

export async function unblockUser(params: { blockerId: string; blockedId: string }) {
  await requireActiveSocialUser(params.blockerId);
  await prisma.userSocialBlock.deleteMany({
    where: { blockerId: params.blockerId, blockedId: params.blockedId },
  });
  return { blocked: false };
}

export async function listBlockedUsers(userId: string) {
  await requireActiveSocialUser(userId);
  const blocks = await prisma.userSocialBlock.findMany({
    where: { blockerId: userId },
    include: {
      blocked: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return blocks.map((b) => ({
    id: b.blocked.id,
    displayName: b.blocked.name,
    avatarUrl: b.blocked.avatarUrl ?? b.blocked.avatar,
    role: b.blocked.role,
    blockedAt: b.createdAt,
    reason: b.reason,
  }));
}
