import { prisma } from "@/lib/prisma";
import type { Prisma, SocialPostStatus, SocialPostVisibility } from "@prisma/client";
import { SocialError } from "@/lib/social/errors";
import {
  requireActiveSocialUser,
  requireSocialPoster,
  assertNotBlocked,
  getBlockedUserIds,
} from "@/lib/social/permissions";
import {
  SOCIAL_POST_MAX_CONTENT,
  SOCIAL_POST_MAX_MEDIA,
  SOCIAL_FEED_DEFAULT_LIMIT,
  SOCIAL_RATE_LIMITS,
} from "@/lib/social/constants";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { extractHashtags, slugifyHashtag } from "@/lib/social/utils";
import { writeAuditLog } from "@/lib/audit-log";

export type PostMediaInput = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  storageProvider: string;
  sortOrder?: number;
};

const VISIBLE_STATUSES = ["PUBLISHED", "REPORTED"] as SocialPostStatus[];

function postInclude() {
  return {
    author: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
    pet: { select: { id: true, name: true, photo: true, species: true } },
    media: { orderBy: { sortOrder: "asc" as const } },
    hashtags: { include: { hashtag: true } },
    _count: { select: { likes: true, comments: true, shares: true, saves: true } },
  } satisfies Prisma.SocialPostInclude;
}

export async function serializePost(post: Awaited<ReturnType<typeof fetchPostRecord>>, viewerId?: string) {
  const [liked, saved, followingAuthor] = viewerId
    ? await Promise.all([
        prisma.socialPostLike.findUnique({
          where: { postId_userId: { postId: post.id, userId: viewerId } },
        }),
        prisma.socialPostSave.findUnique({
          where: { postId_userId: { postId: post.id, userId: viewerId } },
        }),
        prisma.userFollow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: post.authorId } },
        }),
      ])
    : [null, null, null];

  const profile = await prisma.publicProfile.findUnique({
    where: { userId: post.authorId },
    select: { displayName: true, avatarUrl: true },
  });

  return {
    id: post.id,
    authorId: post.authorId,
    author: {
      id: post.author.id,
      name: profile?.displayName ?? post.author.name,
      avatarUrl: profile?.avatarUrl ?? post.author.avatarUrl ?? post.author.avatar,
      role: post.author.role,
    },
    pet: post.pet,
    content: post.deletedAt ? null : post.content,
    visibility: post.visibility,
    status: post.status,
    locationText: post.locationText,
    media: post.media,
    hashtags: post.hashtags.map((h) => ({ id: h.hashtag.id, name: h.hashtag.name, slug: h.hashtag.slug })),
    counts: {
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      saves: post._count.saves,
    },
    editedAt: post.editedAt,
    deletedAt: post.deletedAt,
    createdAt: post.createdAt,
    viewerState: viewerId
      ? { liked: Boolean(liked), saved: Boolean(saved), followingAuthor: Boolean(followingAuthor) }
      : undefined,
  };
}

async function fetchPostRecord(postId: string) {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: postInclude(),
  });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  return post;
}

async function syncHashtags(postId: string, content: string) {
  const names = extractHashtags(content);
  await prisma.socialPostHashtag.deleteMany({ where: { postId } });

  for (const name of names) {
    const slug = slugifyHashtag(name);
    const hashtag = await prisma.hashtag.upsert({
      where: { slug },
      create: { name, slug, usageCount: 1 },
      update: { usageCount: { increment: 1 } },
    });
    await prisma.socialPostHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

export async function createPost(params: {
  authorId: string;
  content?: string;
  visibility?: SocialPostVisibility;
  petId?: string;
  locationText?: string;
  media?: PostMediaInput[];
}) {
  await requireSocialPoster(params.authorId);

  if (!checkSocialRateLimit(`post:${params.authorId}`, SOCIAL_RATE_LIMITS.createPost.limit, SOCIAL_RATE_LIMITS.createPost.windowMs)) {
    throw new SocialError("Muitas publicações em pouco tempo. Aguarde.", "RATE_LIMIT", 429);
  }

  const content = (params.content ?? "").trim();
  const media = params.media ?? [];

  if (!content && media.length === 0) {
    throw new SocialError("Informe texto ou mídia para publicar.", "VALIDATION", 400);
  }
  if (content.length > SOCIAL_POST_MAX_CONTENT) {
    throw new SocialError(`Texto excede ${SOCIAL_POST_MAX_CONTENT} caracteres.`, "VALIDATION", 400);
  }
  if (media.length > SOCIAL_POST_MAX_MEDIA) {
    throw new SocialError(`Máximo de ${SOCIAL_POST_MAX_MEDIA} arquivos por publicação.`, "VALIDATION", 400);
  }

  if (params.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: params.petId, ownerId: params.authorId, deletedAt: null },
    });
    if (!pet) throw new SocialError("Pet inválido.", "VALIDATION", 400);
  }

  const post = await prisma.socialPost.create({
    data: {
      authorId: params.authorId,
      content: content || " ",
      visibility: params.visibility ?? "PUBLIC",
      petId: params.petId,
      locationText: params.locationText,
      media: {
        create: media.map((m, i) => ({
          fileUrl: m.fileUrl,
          fileName: m.fileName,
          mimeType: m.mimeType,
          fileSize: m.fileSize,
          mediaType: m.mediaType,
          storageProvider: m.storageProvider,
          sortOrder: m.sortOrder ?? i,
        })),
      },
    },
    include: postInclude(),
  });

  if (content) await syncHashtags(post.id, content);
  return serializePost(post, params.authorId);
}

export async function updatePost(params: {
  postId: string;
  authorId: string;
  content: string;
}) {
  await requireActiveSocialUser(params.authorId);
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  if (post.authorId !== params.authorId) {
    throw new SocialError("Você só pode editar suas publicações.", "FORBIDDEN", 403);
  }
  if (post.deletedAt || post.status === "REMOVED") {
    throw new SocialError("Publicação removida não pode ser editada.", "FORBIDDEN", 403);
  }

  const content = params.content.trim();
  if (!content) throw new SocialError("Conteúdo obrigatório.", "VALIDATION", 400);
  if (content.length > SOCIAL_POST_MAX_CONTENT) {
    throw new SocialError(`Texto excede ${SOCIAL_POST_MAX_CONTENT} caracteres.`, "VALIDATION", 400);
  }

  const updated = await prisma.socialPost.update({
    where: { id: params.postId },
    data: { content, editedAt: new Date() },
    include: postInclude(),
  });
  await syncHashtags(params.postId, content);
  return serializePost(updated, params.authorId);
}

export async function deletePost(params: {
  postId: string;
  userId: string;
  isAdmin?: boolean;
  reason?: string;
}) {
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);

  if (params.isAdmin) {
    await requireActiveSocialUser(params.userId);
    const updated = await prisma.socialPost.update({
      where: { id: params.postId },
      data: {
        status: "REMOVED",
        deletedAt: new Date(),
        moderatedAt: new Date(),
        moderatedById: params.userId,
        moderationReason: params.reason,
      },
      include: postInclude(),
    });
    await writeAuditLog({
      actorId: params.userId,
      action: "MODERATE",
      module: "social",
      resource: "social_post",
      resourceId: params.postId,
      entityBefore: post,
      entityAfter: updated,
      observation: params.reason,
    });
    return serializePost(updated, params.userId);
  }

  if (post.authorId !== params.userId) {
    throw new SocialError("Você só pode remover suas publicações.", "FORBIDDEN", 403);
  }
  await requireActiveSocialUser(params.userId);

  const updated = await prisma.socialPost.update({
    where: { id: params.postId },
    data: { status: "REMOVED", deletedAt: new Date() },
    include: postInclude(),
  });
  return serializePost(updated, params.userId);
}

export async function getPost(postId: string, viewerId?: string) {
  const post = await fetchPostRecord(postId);
  if (post.status === "REMOVED" && post.authorId !== viewerId) {
    throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  }
  if (viewerId) {
    await assertNotBlocked(viewerId, post.authorId);
    if (post.visibility === "PRIVATE" && post.authorId !== viewerId) {
      throw new SocialError("Publicação privada.", "FORBIDDEN", 403);
    }
    if (post.visibility === "FOLLOWERS" && post.authorId !== viewerId) {
      const follows = await prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: post.authorId } },
      });
      if (!follows) throw new SocialError("Publicação visível apenas para seguidores.", "FORBIDDEN", 403);
    }
  } else if (post.visibility !== "PUBLIC") {
    throw new SocialError("Autenticação necessária.", "UNAUTHORIZED", 401);
  }
  return serializePost(post, viewerId);
}

export async function listFeed(params: {
  viewerId?: string;
  cursor?: string;
  limit?: number;
  hashtag?: string;
  authorId?: string;
  petId?: string;
  mediaType?: string;
}) {
  const limit = Math.min(params.limit ?? SOCIAL_FEED_DEFAULT_LIMIT, 50);
  const blockedIds = params.viewerId ? await getBlockedUserIds(params.viewerId) : [];

  const where: Prisma.SocialPostWhereInput = {
    status: { in: VISIBLE_STATUSES },
    deletedAt: null,
    authorId: blockedIds.length ? { notIn: blockedIds } : undefined,
  };

  if (params.authorId) where.authorId = params.authorId;
  if (params.petId) where.petId = params.petId;
  if (params.hashtag) {
    where.hashtags = { some: { hashtag: { slug: params.hashtag } } };
  }
  if (params.mediaType) {
    where.media = { some: { mediaType: params.mediaType as "IMAGE" | "VIDEO" | "DOCUMENT" } };
  }

  if (!params.viewerId) {
    where.visibility = "PUBLIC";
  } else {
    const following = await prisma.userFollow.findMany({
      where: { followerId: params.viewerId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    where.OR = [
      { visibility: "PUBLIC" },
      { authorId: params.viewerId },
      { visibility: "FOLLOWERS", authorId: { in: followingIds } },
    ];
  }

  const posts = await prisma.socialPost.findMany({
    where,
    include: postInclude(),
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const items = await Promise.all(slice.map((p) => serializePost(p, params.viewerId)));

  return {
    posts: items,
    nextCursor: hasMore ? slice[slice.length - 1]?.id : null,
  };
}
