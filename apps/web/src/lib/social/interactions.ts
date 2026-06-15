import { prisma } from "@/lib/prisma";
import { SocialError } from "@/lib/social/errors";
import { requireActiveSocialUser, assertNotBlocked } from "@/lib/social/permissions";
import { SOCIAL_RATE_LIMITS, SOCIAL_FEED_DEFAULT_LIMIT } from "@/lib/social/constants";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { serializePost } from "@/lib/social/posts";
import { sharePostToConversation } from "@/lib/social/sharing/internal-share-service";
import { notifyPostLiked, notifyPostShared } from "@/lib/social/notifications/social-notification-service";

const postInclude = {
  author: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
  pet: { select: { id: true, name: true, photo: true, species: true } },
  media: { orderBy: { sortOrder: "asc" as const } },
  hashtags: { include: { hashtag: true } },
  _count: { select: { likes: true, comments: true, shares: true, saves: true } },
};

async function getInteractablePost(postId: string, userId: string) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post || post.deletedAt || post.status === "REMOVED" || post.status === "HIDDEN") {
    throw new SocialError("Publicação não disponível.", "NOT_FOUND", 404);
  }
  await assertNotBlocked(userId, post.authorId);
  return post;
}

export async function togglePostLike(params: { postId: string; userId: string; like: boolean }) {
  await requireActiveSocialUser(params.userId);
  const post = await getInteractablePost(params.postId, params.userId);

  if (params.like) {
    await prisma.socialPostLike.upsert({
      where: { postId_userId: { postId: params.postId, userId: params.userId } },
      create: { postId: params.postId, userId: params.userId },
      update: {},
    });
    if (post.authorId !== params.userId) {
      await notifyPostLiked({ postId: params.postId, likerId: params.userId, postAuthorId: post.authorId });
    }
  } else {
    await prisma.socialPostLike.deleteMany({
      where: { postId: params.postId, userId: params.userId },
    });
  }

  const count = await prisma.socialPostLike.count({ where: { postId: params.postId } });
  return { liked: params.like, count };
}

export async function togglePostSave(params: { postId: string; userId: string; save: boolean }) {
  await requireActiveSocialUser(params.userId);
  await getInteractablePost(params.postId, params.userId);

  if (params.save) {
    await prisma.socialPostSave.upsert({
      where: { postId_userId: { postId: params.postId, userId: params.userId } },
      create: { postId: params.postId, userId: params.userId },
      update: {},
    });
  } else {
    await prisma.socialPostSave.deleteMany({
      where: { postId: params.postId, userId: params.userId },
    });
  }

  return { saved: params.save };
}

export async function sharePost(params: {
  postId: string;
  userId: string;
  targetConversationId?: string;
  message?: string;
}) {
  await requireActiveSocialUser(params.userId);
  if (!checkSocialRateLimit(`share:${params.userId}`, SOCIAL_RATE_LIMITS.share.limit, SOCIAL_RATE_LIMITS.share.windowMs)) {
    throw new SocialError("Muitos compartilhamentos em pouco tempo.", "RATE_LIMIT", 429);
  }

  const post = await getInteractablePost(params.postId, params.userId);

  const share = await prisma.socialPostShare.create({
    data: {
      postId: params.postId,
      userId: params.userId,
      targetConversationId: params.targetConversationId,
      message: params.message,
    },
  });

  let chatMessageId: string | undefined;
  if (params.targetConversationId) {
    chatMessageId = await sharePostToConversation({
      conversationId: params.targetConversationId,
      senderId: params.userId,
      postId: params.postId,
      message: params.message,
    });
  }

  if (post.authorId !== params.userId) {
    await notifyPostShared({
      postId: params.postId,
      sharerId: params.userId,
      postAuthorId: post.authorId,
    });
  }

  const { buildPostShareLink } = await import("@/lib/social/utils");
  return {
    shareId: share.id,
    link: buildPostShareLink(params.postId),
    chatMessageId,
  };
}

export async function listSavedPosts(params: { userId: string; cursor?: string; limit?: number }) {
  await requireActiveSocialUser(params.userId);
  const limit = Math.min(params.limit ?? SOCIAL_FEED_DEFAULT_LIMIT, 50);

  const saves = await prisma.socialPostSave.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    include: { post: { include: postInclude } },
  });

  const hasMore = saves.length > limit;
  const slice = hasMore ? saves.slice(0, limit) : saves;
  const posts = await Promise.all(
    slice.filter((s) => s.post && !s.post.deletedAt && s.post.status !== "REMOVED").map((s) => serializePost(s.post, params.userId))
  );

  return { posts, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}
