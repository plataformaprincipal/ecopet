import { prisma } from "@/lib/prisma";
import type { GestorFilters } from "@/lib/gestor/gestor-filters";
import { dateRangeWhere, paginationArgs } from "@/lib/gestor/gestor-filters";
import { sanitizeMetadata } from "@/lib/gestor/gestor-utils";

export async function getGestorSocial(filters: GestorFilters) {
  const dateWhere = dateRangeWhere(filters);
  const [
    postsCreated,
    postsHidden,
    commentsCount,
    likesCount,
    sharesCount,
    reportsOpen,
    reportsResolved,
    topHashtags,
    topAuthors,
  ] = await Promise.all([
    prisma.socialPost.count({ where: { ...dateWhere, deletedAt: null } }),
    prisma.socialPost.count({ where: { ...dateWhere, status: "HIDDEN" } }),
    prisma.socialComment.count({ where: { ...dateWhere, deletedAt: null } }),
    prisma.socialPostLike.count({ where: dateWhere }),
    prisma.socialPostShare.count({ where: dateWhere }),
    prisma.socialReport.count({ where: { status: "OPEN" } }),
    prisma.socialReport.count({ where: { status: { in: ["RESOLVED", "REJECTED"] } } }),
    prisma.hashtag.findMany({
      orderBy: { usageCount: "desc" },
      take: 10,
      select: { name: true, slug: true, usageCount: true },
    }),
    prisma.socialPost.groupBy({
      by: ["authorId"],
      _count: { _all: true },
      where: dateWhere,
      orderBy: { _count: { authorId: "desc" } },
      take: 10,
    }),
  ]);

  const authorIds = topAuthors.map((a) => a.authorId);
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
    : [];
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  return {
    metrics: [
      { key: "posts", label: "Posts criados", value: postsCreated },
      { key: "posts_hidden", label: "Posts ocultos", value: postsHidden },
      { key: "comments", label: "Comentários", value: commentsCount },
      { key: "likes", label: "Curtidas", value: likesCount },
      { key: "shares", label: "Compartilhamentos", value: sharesCount },
      { key: "reports_open", label: "Denúncias abertas", value: reportsOpen },
      { key: "reports_resolved", label: "Denúncias resolvidas", value: reportsResolved },
    ],
    topHashtags,
    topAuthors: topAuthors.map((a) => ({
      authorId: a.authorId,
      name: authorMap.get(a.authorId) ?? a.authorId,
      postsCount: a._count._all,
    })),
  };
}

export async function getGestorModeration(filters: GestorFilters) {
  const where = {
    ...(filters.status
      ? { status: filters.status as "OPEN" | "RESOLVED" | "REJECTED" | "REVIEWING" }
      : {}),
    ...dateRangeWhere(filters),
  };
  const [total, items, byStatus] = await Promise.all([
    prisma.socialReport.count({ where }),
    prisma.socialReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true } },
        post: { select: { id: true, content: true, status: true, author: { select: { name: true } } } },
        comment: { select: { id: true, content: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
    }),
    prisma.socialReport.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return {
    metrics: byStatus.map((s) => ({ key: s.status, label: s.status, value: s._count._all })),
    items: items.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      description: r.description,
      reporterName: r.reporter.name,
      postPreview: r.post ? { id: r.post.id, content: r.post.content.slice(0, 120), author: r.post.author.name, status: r.post.status } : null,
      commentPreview: r.comment ? { id: r.comment.id, content: r.comment.content.slice(0, 120), status: r.comment.status } : null,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}

export async function getGestorAudit(filters: GestorFilters) {
  const where = {
    ...dateRangeWhere(filters),
    ...(filters.type ? { module: filters.type } : {}),
    ...(filters.q
      ? {
          OR: [
            { resource: { contains: filters.q, mode: "insensitive" as const } },
            { observation: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationArgs(filters),
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    items: logs.map((l) => ({
      id: l.id,
      action: l.action,
      module: l.module,
      resource: l.resource,
      resourceId: l.resourceId,
      observation: l.observation,
      actor: l.actor,
      metadata: sanitizeMetadata(l.metadata),
      entityBefore: sanitizeMetadata(l.entityBefore),
      entityAfter: sanitizeMetadata(l.entityAfter),
      createdAt: l.createdAt.toISOString(),
    })),
    pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) || 1 },
  };
}
