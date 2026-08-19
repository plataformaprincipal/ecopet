import { prisma } from "@/lib/prisma";
import type { Prisma, SocialPostType, SocialPostVisibility } from "@prisma/client";
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
import { canCreateSocialPost } from "@/lib/social/persona-permissions";
import type { SocialUser } from "@/lib/social/permissions";
import {
  SOCIAL_VISIBLE_STATUSES,
  SOCIAL_MAX_PINNED_POSTS,
  canViewPost,
  canEditPost,
  canDeletePost,
  canPinPost,
  visibilityWhereForViewer,
} from "@/lib/social/post-authorization";

export type AdoptionMetaInput = {
  animalName?: string;
  species?: string;
  approximateAge?: string;
  sex?: string;
  size?: string;
  city?: string;
  state?: string;
  description?: string;
  status?: "AVAILABLE" | "IN_REVIEW" | "ADOPTED";
};

export type PostMediaInput = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
  storageProvider: string;
  sortOrder?: number;
};

const VISIBLE_STATUSES = SOCIAL_VISIBLE_STATUSES;

function postInclude() {
  return {
    author: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
    pet: { select: { id: true, name: true, photo: true, species: true } },
    media: { orderBy: { sortOrder: "asc" as const } },
    hashtags: { include: { hashtag: true } },
    _count: { select: { likes: true, comments: true, shares: true, saves: true } },
  } satisfies Prisma.SocialPostInclude;
}

type PostRecord = Awaited<ReturnType<typeof fetchPostRecord>>;
type ViewerState = { liked: boolean; saved: boolean; followingAuthor: boolean };
type AuthorProfile = { displayName: string | null; avatarUrl: string | null } | null;

/** Mapeamento puro (sem I/O) do registro do post para o DTO da API. */
function mapPost(post: PostRecord, profile: AuthorProfile, viewerState?: ViewerState, viewerId?: string) {
  const isOwner = Boolean(viewerId && viewerId === post.authorId);
  const likesVisible = !post.hideLikeCount || isOwner;
  return {
    id: post.id,
    authorId: post.authorId,
    authorRole: post.authorRole,
    type: post.type,
    author: {
      id: post.author.id,
      name: profile?.displayName ?? post.author.name,
      avatarUrl: profile?.avatarUrl ?? post.author.avatarUrl ?? post.author.avatar,
      role: post.author.role,
    },
    pet: post.pet,
    content: post.deletedAt && !isOwner ? null : post.content,
    visibility: post.visibility,
    status: post.status,
    locationText: post.locationText,
    linkedProductId: post.linkedProductId,
    linkedServiceId: post.linkedServiceId,
    linkedCampaignId: post.linkedCampaignId,
    linkedPetId: post.petId,
    adoptionMeta: post.adoptionMeta,
    isPinned: post.isPinned,
    isFeatured: post.isFeatured,
    commentsEnabled: post.commentsEnabled,
    hideLikeCount: post.hideLikeCount,
    likesVisible,
    archivedAt: post.archivedAt,
    media: post.media,
    hashtags: post.hashtags.map((h) => ({ id: h.hashtag.id, name: h.hashtag.name, slug: h.hashtag.slug })),
    counts: {
      likes: likesVisible ? post._count.likes : 0,
      comments: post._count.comments,
      shares: post._count.shares,
      saves: post._count.saves,
    },
    editedAt: post.editedAt,
    deletedAt: post.deletedAt,
    createdAt: post.createdAt,
    viewerState,
  };
}

export async function serializePost(post: PostRecord, viewerId?: string) {
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

  const viewerState = viewerId
    ? { liked: Boolean(liked), saved: Boolean(saved), followingAuthor: Boolean(followingAuthor) }
    : undefined;

  return mapPost(post, profile, viewerState, viewerId);
}

/**
 * Serialização EM LOTE para listas (feed/trending): evita N+1 buscando
 * perfis e estado-do-viewer de todos os posts em poucas consultas.
 */
export async function serializePosts(posts: PostRecord[], viewerId?: string) {
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.authorId))];

  const profiles = await prisma.publicProfile.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, displayName: true, avatarUrl: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  let likedSet = new Set<string>();
  let savedSet = new Set<string>();
  let followSet = new Set<string>();

  if (viewerId) {
    const [likes, saves, follows] = await Promise.all([
      prisma.socialPostLike.findMany({
        where: { userId: viewerId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.socialPostSave.findMany({
        where: { userId: viewerId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.userFollow.findMany({
        where: { followerId: viewerId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
    ]);
    likedSet = new Set(likes.map((l) => l.postId));
    savedSet = new Set(saves.map((s) => s.postId));
    followSet = new Set(follows.map((f) => f.followingId));
  }

  return posts.map((post) =>
    mapPost(
      post,
      profileMap.get(post.authorId) ?? null,
      viewerId
        ? {
            liked: likedSet.has(post.id),
            saved: savedSet.has(post.id),
            followingAuthor: followSet.has(post.authorId),
          }
        : undefined,
      viewerId
    )
  );
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
  type?: SocialPostType;
  content?: string;
  visibility?: SocialPostVisibility;
  petId?: string;
  locationText?: string;
  linkedProductId?: string;
  linkedServiceId?: string;
  linkedCampaignId?: string;
  adoptionMeta?: AdoptionMetaInput;
  media?: PostMediaInput[];
}) {
  const author = await requireSocialPoster(params.authorId);
  const postType = params.type ?? "GENERAL";

  if (!canCreateSocialPost(author as SocialUser, postType)) {
    throw new SocialError(`Seu perfil não pode publicar conteúdo do tipo ${postType}.`, "FORBIDDEN", 403);
  }

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

  if (params.linkedProductId) {
    const product = await prisma.product.findFirst({
      where: { id: params.linkedProductId, sellerId: params.authorId, deletedAt: null },
    });
    if (!product) throw new SocialError("Produto inválido ou não pertence ao parceiro.", "VALIDATION", 400);
  }

  if (params.linkedServiceId) {
    const service = await prisma.service.findFirst({
      where: { id: params.linkedServiceId, providerId: params.authorId, deletedAt: null },
    });
    if (!service) throw new SocialError("Serviço inválido ou não pertence ao parceiro.", "VALIDATION", 400);
  }

  const post = await prisma.socialPost.create({
    data: {
      authorId: params.authorId,
      authorRole: author.role,
      type: postType,
      content: content || " ",
      visibility: params.visibility ?? "PUBLIC",
      petId: params.petId,
      locationText: params.locationText,
      linkedProductId: params.linkedProductId,
      linkedServiceId: params.linkedServiceId,
      linkedCampaignId: params.linkedCampaignId,
      adoptionMeta: params.adoptionMeta ? (params.adoptionMeta as Prisma.InputJsonValue) : undefined,
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
  content?: string;
  visibility?: SocialPostVisibility;
  commentsEnabled?: boolean;
  hideLikeCount?: boolean;
  isPinned?: boolean;
  archive?: boolean;
  unarchive?: boolean;
  restore?: boolean;
}) {
  await requireActiveSocialUser(params.authorId);
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  if (!canEditPost(params.authorId, post.authorId)) {
    throw new SocialError("Você só pode editar suas publicações.", "FORBIDDEN", 403);
  }

  if (params.restore) {
    if (!post.deletedAt) {
      throw new SocialError("Publicação não está na lixeira.", "VALIDATION", 400);
    }
    const restored = await prisma.socialPost.update({
      where: { id: params.postId },
      data: { deletedAt: null, status: "PUBLISHED" },
      include: postInclude(),
    });
    return serializePost(restored, params.authorId);
  }

  if (post.deletedAt || post.status === "REMOVED") {
    throw new SocialError("Publicação removida não pode ser editada.", "FORBIDDEN", 403);
  }

  const data: Prisma.SocialPostUpdateInput = {};

  if (typeof params.content === "string") {
    const content = params.content.trim();
    if (!content) throw new SocialError("Conteúdo obrigatório.", "VALIDATION", 400);
    if (content.length > SOCIAL_POST_MAX_CONTENT) {
      throw new SocialError(`Texto excede ${SOCIAL_POST_MAX_CONTENT} caracteres.`, "VALIDATION", 400);
    }
    data.content = content;
    data.editedAt = new Date();
  }

  if (params.visibility) {
    if (!["PUBLIC", "FOLLOWERS", "PRIVATE"].includes(params.visibility)) {
      throw new SocialError("Visibilidade inválida.", "VALIDATION", 400);
    }
    data.visibility = params.visibility;
  }

  if (typeof params.commentsEnabled === "boolean") {
    data.commentsEnabled = params.commentsEnabled;
  }

  if (typeof params.hideLikeCount === "boolean") {
    data.hideLikeCount = params.hideLikeCount;
  }

  if (typeof params.isPinned === "boolean") {
    if (params.isPinned) {
      const pinnedCount = await prisma.socialPost.count({
        where: {
          authorId: params.authorId,
          isPinned: true,
          deletedAt: null,
          archivedAt: null,
          id: { not: params.postId },
        },
      });
      if (!canPinPost(pinnedCount, true)) {
        throw new SocialError(`Você pode fixar no máximo ${SOCIAL_MAX_PINNED_POSTS} publicações.`, "VALIDATION", 400);
      }
    }
    data.isPinned = params.isPinned;
  }

  if (params.archive) {
    data.archivedAt = new Date();
    data.isPinned = false;
  }
  if (params.unarchive) {
    data.archivedAt = null;
  }

  if (Object.keys(data).length === 0) {
    throw new SocialError("Nenhuma alteração informada.", "VALIDATION", 400);
  }

  const updated = await prisma.socialPost.update({
    where: { id: params.postId },
    data,
    include: postInclude(),
  });
  if (typeof params.content === "string") {
    await syncHashtags(params.postId, params.content.trim());
  }
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
        isPinned: false,
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

  if (!canDeletePost(params.userId, post.authorId, false)) {
    throw new SocialError("Você só pode remover suas publicações.", "FORBIDDEN", 403);
  }
  await requireActiveSocialUser(params.userId);

  const updated = await prisma.socialPost.update({
    where: { id: params.postId },
    data: { deletedAt: new Date(), isPinned: false },
    include: postInclude(),
  });
  return serializePost(updated, params.userId);
}

export async function restorePost(params: { postId: string; userId: string }) {
  return updatePost({ postId: params.postId, authorId: params.userId, restore: true });
}

export async function hardDeletePost(params: { postId: string; userId: string }) {
  await requireActiveSocialUser(params.userId);
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  if (post.authorId !== params.userId) {
    throw new SocialError("Você só pode apagar suas publicações.", "FORBIDDEN", 403);
  }
  if (!post.deletedAt) {
    throw new SocialError("Mova a publicação para a lixeira antes de apagar definitivamente.", "VALIDATION", 400);
  }

  const snapshot = {
    postId: post.id,
    authorId: post.authorId,
    content: post.content.slice(0, 2000),
    visibility: post.visibility,
    type: post.type,
    deletedAt: post.deletedAt.toISOString(),
    hardDeletedAt: new Date().toISOString(),
  };

  await prisma.socialReport.updateMany({
    where: { postId: post.id },
    data: { targetSnapshot: snapshot as Prisma.InputJsonValue },
  });

  await prisma.socialPost.delete({ where: { id: post.id } });
  return { deleted: true, id: params.postId };
}

export async function listTrash(params: { userId: string; cursor?: string; limit?: number }) {
  await requireActiveSocialUser(params.userId);
  const limit = Math.min(params.limit ?? SOCIAL_FEED_DEFAULT_LIMIT, 50);
  const posts = await prisma.socialPost.findMany({
    where: { authorId: params.userId, deletedAt: { not: null } },
    include: postInclude(),
    orderBy: { deletedAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });
  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const items = await serializePosts(slice, params.userId);
  return { posts: items, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}

export async function hidePostForViewer(params: {
  postId: string;
  userId: string;
  kind: "HIDE" | "NOT_INTERESTED";
}) {
  await requireActiveSocialUser(params.userId);
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post || post.deletedAt) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  if (post.authorId === params.userId) {
    throw new SocialError("Você não pode ocultar a própria publicação.", "VALIDATION", 400);
  }

  await prisma.socialHiddenPost.upsert({
    where: { userId_postId: { userId: params.userId, postId: params.postId } },
    create: { userId: params.userId, postId: params.postId, kind: params.kind },
    update: { kind: params.kind },
  });

  return { hidden: true, kind: params.kind, persisted: true };
}

export async function getPost(postId: string, viewerId?: string) {
  const post = await fetchPostRecord(postId);
  let followsAuthor = false;
  let isBlocked = false;
  if (viewerId) {
    const [follow, blockedIds] = await Promise.all([
      prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: post.authorId } },
      }),
      getBlockedUserIds(viewerId),
    ]);
    followsAuthor = Boolean(follow);
    isBlocked = blockedIds.includes(post.authorId);
  }

  const visible = canViewPost(post, {
    viewerId,
    followsAuthor,
    isBlocked,
    includeOwnTrash: Boolean(viewerId && viewerId === post.authorId),
  });
  if (!visible) {
    if (!viewerId && post.visibility !== "PUBLIC") {
      throw new SocialError("Autenticação necessária.", "UNAUTHORIZED", 401);
    }
    throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  }
  if (viewerId) await assertNotBlocked(viewerId, post.authorId);
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
  type?: SocialPostType;
}) {
  const limit = Math.min(params.limit ?? SOCIAL_FEED_DEFAULT_LIMIT, 50);
  const blockedIds = params.viewerId ? await getBlockedUserIds(params.viewerId) : [];
  const mutedIds = params.viewerId
    ? (
        await prisma.userSocialMute.findMany({
          where: { muterId: params.viewerId },
          select: { mutedId: true },
        })
      ).map((m) => m.mutedId)
    : [];
  const excludedAuthorIds = [...new Set([...blockedIds, ...mutedIds])];

  const hiddenIds = params.viewerId
    ? (
        await prisma.socialHiddenPost.findMany({
          where: { userId: params.viewerId },
          select: { postId: true },
        })
      ).map((h) => h.postId)
    : [];

  const followingIds = params.viewerId
    ? (
        await prisma.userFollow.findMany({
          where: { followerId: params.viewerId },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : [];

  const where: Prisma.SocialPostWhereInput = {
    status: { in: VISIBLE_STATUSES },
    deletedAt: null,
    archivedAt: null,
    authorId: excludedAuthorIds.length ? { notIn: excludedAuthorIds } : undefined,
    id: hiddenIds.length ? { notIn: hiddenIds } : undefined,
    ...visibilityWhereForViewer({ viewerId: params.viewerId, followingIds }),
  };

  // Perfil do autor: incluir arquivados apenas para o próprio autor
  if (params.authorId) {
    where.authorId = params.authorId;
    if (params.viewerId === params.authorId) {
      delete where.archivedAt;
    }
  }
  if (params.petId) where.petId = params.petId;
  if (params.hashtag) {
    where.hashtags = { some: { hashtag: { slug: params.hashtag } } };
  }
  if (params.mediaType) {
    where.media = { some: { mediaType: params.mediaType as "IMAGE" | "VIDEO" | "DOCUMENT" } };
  }
  if (params.type) {
    where.type = params.type;
  }

  const posts = await prisma.socialPost.findMany({
    where,
    include: postInclude(),
    orderBy: params.authorId
      ? [{ isPinned: "desc" }, { createdAt: "desc" }]
      : { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const items = await serializePosts(slice, params.viewerId);

  return {
    posts: items,
    nextCursor: hasMore ? slice[slice.length - 1]?.id : null,
  };
}
