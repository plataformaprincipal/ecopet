import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SocialError } from "@/lib/social/errors";
import { requireActiveSocialUser, assertNotBlocked } from "@/lib/social/permissions";
import {
  SOCIAL_COMMENT_MAX_CONTENT,
  SOCIAL_COMMENTS_DEFAULT_LIMIT,
  SOCIAL_RATE_LIMITS,
} from "@/lib/social/constants";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { notifyPostCommented, notifyCommentReplied } from "@/lib/social/notifications/social-notification-service";

const VISIBLE_COMMENT = ["PUBLISHED", "REPORTED"] as const;

function commentInclude() {
  return {
    author: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
    _count: { select: { likes: true, replies: true } },
    replies: {
      where: { status: { in: [...VISIBLE_COMMENT] }, deletedAt: null },
      include: {
        author: { select: { id: true, name: true, avatar: true, avatarUrl: true, role: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: "asc" as const },
    },
  } satisfies Prisma.SocialCommentInclude;
}

async function serializeComment(
  comment: Prisma.SocialCommentGetPayload<{ include: ReturnType<typeof commentInclude> }>,
  viewerId?: string
) {
  const liked = viewerId
    ? await prisma.socialCommentLike.findUnique({
        where: { commentId_userId: { commentId: comment.id, userId: viewerId } },
      })
    : null;

  const profile = await prisma.publicProfile.findUnique({
    where: { userId: comment.authorId },
    select: { displayName: true, avatarUrl: true },
  });

  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    parentCommentId: comment.parentCommentId,
    content: comment.deletedAt ? null : comment.content,
    status: comment.status,
    author: {
      id: comment.author.id,
      name: profile?.displayName ?? comment.author.name,
      avatarUrl: profile?.avatarUrl ?? comment.author.avatarUrl ?? comment.author.avatar,
      role: comment.author.role,
    },
    counts: { likes: comment._count.likes, replies: comment._count.replies },
    editedAt: comment.editedAt,
    deletedAt: comment.deletedAt,
    createdAt: comment.createdAt,
    replies: comment.replies?.map((r) => ({
      id: r.id,
      postId: r.postId,
      authorId: r.authorId,
      parentCommentId: r.parentCommentId,
      content: r.deletedAt ? null : r.content,
      status: r.status,
      author: {
        id: r.author.id,
        name: profile?.displayName ?? r.author.name,
        avatarUrl: profile?.avatarUrl ?? r.author.avatarUrl ?? r.author.avatar,
        role: r.author.role,
      },
      counts: { likes: r._count.likes },
      editedAt: r.editedAt,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
    })),
    viewerState: viewerId ? { liked: Boolean(liked) } : undefined,
  };
}

async function assertPostCommentable(postId: string) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
  if (post.deletedAt || post.status === "REMOVED" || post.status === "HIDDEN") {
    throw new SocialError("Não é possível comentar nesta publicação.", "FORBIDDEN", 403);
  }
  return post;
}

export async function listComments(params: {
  postId: string;
  viewerId?: string;
  cursor?: string;
  limit?: number;
}) {
  await assertPostCommentable(params.postId);
  const limit = Math.min(params.limit ?? SOCIAL_COMMENTS_DEFAULT_LIMIT, 50);

  const comments = await prisma.socialComment.findMany({
    where: {
      postId: params.postId,
      parentCommentId: null,
      status: { in: [...VISIBLE_COMMENT] },
      deletedAt: null,
    },
    include: commentInclude(),
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = comments.length > limit;
  const slice = hasMore ? comments.slice(0, limit) : comments;
  const items = await Promise.all(slice.map((c) => serializeComment(c, params.viewerId)));

  return { comments: items, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}

export async function createComment(params: {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}) {
  await requireActiveSocialUser(params.authorId);
  if (!checkSocialRateLimit(`comment:${params.authorId}`, SOCIAL_RATE_LIMITS.comment.limit, SOCIAL_RATE_LIMITS.comment.windowMs)) {
    throw new SocialError("Muitos comentários em pouco tempo.", "RATE_LIMIT", 429);
  }

  const post = await assertPostCommentable(params.postId);
  await assertNotBlocked(params.authorId, post.authorId);

  const content = params.content.trim();
  if (!content) throw new SocialError("Comentário obrigatório.", "VALIDATION", 400);
  if (content.length > SOCIAL_COMMENT_MAX_CONTENT) {
    throw new SocialError(`Comentário excede ${SOCIAL_COMMENT_MAX_CONTENT} caracteres.`, "VALIDATION", 400);
  }

  if (params.parentCommentId) {
    const parent = await prisma.socialComment.findUnique({ where: { id: params.parentCommentId } });
    if (!parent || parent.postId !== params.postId) {
      throw new SocialError("Comentário pai inválido.", "VALIDATION", 400);
    }
    await assertNotBlocked(params.authorId, parent.authorId);
  }

  const comment = await prisma.socialComment.create({
    data: {
      postId: params.postId,
      authorId: params.authorId,
      content,
      parentCommentId: params.parentCommentId,
    },
    include: commentInclude(),
  });

  if (params.parentCommentId) {
    const parent = await prisma.socialComment.findUnique({ where: { id: params.parentCommentId } });
    if (parent && parent.authorId !== params.authorId) {
      await notifyCommentReplied({ commentId: comment.id, postId: params.postId, replierId: params.authorId, parentAuthorId: parent.authorId });
    }
  } else if (post.authorId !== params.authorId) {
    await notifyPostCommented({ postId: params.postId, commenterId: params.authorId, postAuthorId: post.authorId });
  }

  return serializeComment(comment, params.authorId);
}

export async function updateComment(params: { commentId: string; authorId: string; content: string }) {
  await requireActiveSocialUser(params.authorId);
  const comment = await prisma.socialComment.findUnique({ where: { id: params.commentId } });
  if (!comment) throw new SocialError("Comentário não encontrado.", "NOT_FOUND", 404);
  if (comment.authorId !== params.authorId) {
    throw new SocialError("Você só pode editar seus comentários.", "FORBIDDEN", 403);
  }

  const content = params.content.trim();
  if (!content) throw new SocialError("Conteúdo obrigatório.", "VALIDATION", 400);

  const updated = await prisma.socialComment.update({
    where: { id: params.commentId },
    data: { content, editedAt: new Date() },
    include: commentInclude(),
  });
  return serializeComment(updated, params.authorId);
}

export async function deleteComment(params: { commentId: string; userId: string }) {
  await requireActiveSocialUser(params.userId);
  const comment = await prisma.socialComment.findUnique({ where: { id: params.commentId } });
  if (!comment) throw new SocialError("Comentário não encontrado.", "NOT_FOUND", 404);
  if (comment.authorId !== params.userId) {
    throw new SocialError("Você só pode remover seus comentários.", "FORBIDDEN", 403);
  }

  const updated = await prisma.socialComment.update({
    where: { id: params.commentId },
    data: { status: "REMOVED", deletedAt: new Date() },
    include: commentInclude(),
  });
  return serializeComment(updated, params.userId);
}

export async function toggleCommentLike(params: { commentId: string; userId: string; like: boolean }) {
  await requireActiveSocialUser(params.userId);
  const comment = await prisma.socialComment.findUnique({
    where: { id: params.commentId },
    include: { post: true },
  });
  if (!comment || comment.deletedAt) throw new SocialError("Comentário não encontrado.", "NOT_FOUND", 404);
  await assertNotBlocked(params.userId, comment.authorId);

  if (params.like) {
    await prisma.socialCommentLike.upsert({
      where: { commentId_userId: { commentId: params.commentId, userId: params.userId } },
      create: { commentId: params.commentId, userId: params.userId },
      update: {},
    });
  } else {
    await prisma.socialCommentLike.deleteMany({
      where: { commentId: params.commentId, userId: params.userId },
    });
  }

  const count = await prisma.socialCommentLike.count({ where: { commentId: params.commentId } });
  return { liked: params.like, count };
}
