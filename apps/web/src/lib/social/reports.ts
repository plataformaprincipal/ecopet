import { prisma } from "@/lib/prisma";
import { SocialError } from "@/lib/social/errors";
import { requireActiveSocialUser } from "@/lib/social/permissions";
import { SOCIAL_RATE_LIMITS } from "@/lib/social/constants";
import { checkSocialRateLimit } from "@/lib/social/rate-limit";
import { writeAuditLog } from "@/lib/audit-log";
import { emitPlatformEvent, PLATFORM_EVENTS } from "@/lib/events/event-bus";
import { notifyModerationApplied, notifyReportReceived } from "@/lib/social/notifications/social-notification-service";
import type { SocialReportReason } from "@prisma/client";

export async function createReport(params: {
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: SocialReportReason;
  description?: string;
}) {
  await requireActiveSocialUser(params.reporterId);

  if (!checkSocialRateLimit(`report:${params.reporterId}`, SOCIAL_RATE_LIMITS.report.limit, SOCIAL_RATE_LIMITS.report.windowMs)) {
    throw new SocialError("Muitas denúncias em pouco tempo.", "RATE_LIMIT", 429);
  }

  if (!params.postId && !params.commentId) {
    throw new SocialError("Informe post ou comentário.", "VALIDATION", 400);
  }

  if (params.postId) {
    const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
    if (!post || post.deletedAt) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);
    if (post.authorId === params.reporterId) {
      throw new SocialError("Você não pode denunciar sua publicação.", "VALIDATION", 400);
    }
  }

  if (params.commentId) {
    const comment = await prisma.socialComment.findUnique({ where: { id: params.commentId } });
    if (!comment || comment.deletedAt) throw new SocialError("Comentário não encontrado.", "NOT_FOUND", 404);
    if (comment.authorId === params.reporterId) {
      throw new SocialError("Você não pode denunciar seu comentário.", "VALIDATION", 400);
    }
  }

  const report = await prisma.socialReport.create({
    data: {
      reporterId: params.reporterId,
      postId: params.postId,
      commentId: params.commentId,
      reason: params.reason,
      description: params.description,
    },
  });

  if (params.postId) {
    await prisma.socialPost.update({
      where: { id: params.postId },
      data: { status: "REPORTED" },
    });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
  });
  for (const admin of admins) {
    await notifyReportReceived({ adminId: admin.id, reportId: report.id });
  }

  if (params.postId) {
    await emitPlatformEvent({
      type: PLATFORM_EVENTS.POST_REPORTED,
      actorId: params.reporterId,
      entityType: "SocialPost",
      entityId: params.postId,
      payload: { reportId: report.id, reason: params.reason },
      severity: params.reason === "VIOLENCE" || params.reason === "HATE" ? "high" : "medium",
    }).catch(() => undefined);
  }

  return { id: report.id, status: report.status };
}

export async function listAdminReports(params: { status?: string; cursor?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 20, 50);
  const reports = await prisma.socialReport.findMany({
    where: params.status ? { status: params.status as "OPEN" | "REVIEWING" | "RESOLVED" | "REJECTED" } : undefined,
    include: {
      reporter: { select: { id: true, name: true } },
      post: { select: { id: true, content: true, authorId: true, status: true } },
      comment: { select: { id: true, content: true, authorId: true, status: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = reports.length > limit;
  const slice = hasMore ? reports.slice(0, limit) : reports;
  return { reports: slice, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}

export async function getAdminReport(reportId: string) {
  const report = await prisma.socialReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, name: true } },
      post: true,
      comment: true,
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  if (!report) throw new SocialError("Denúncia não encontrada.", "NOT_FOUND", 404);
  return report;
}

export async function updateAdminReport(params: {
  reportId: string;
  adminId: string;
  status: "REVIEWING" | "RESOLVED" | "REJECTED";
  resolution?: string;
}) {
  const before = await getAdminReport(params.reportId);
  const updated = await prisma.socialReport.update({
    where: { id: params.reportId },
    data: {
      status: params.status,
      reviewedById: params.adminId,
      reviewedAt: new Date(),
      resolution: params.resolution,
    },
  });

  await writeAuditLog({
    actorId: params.adminId,
    action: "MODERATE",
    module: "social",
    resource: "social_report",
    resourceId: params.reportId,
    entityBefore: before,
    entityAfter: updated,
    observation: params.resolution,
  });

  return updated;
}

export async function moderatePost(params: {
  postId: string;
  adminId: string;
  action: "HIDE" | "RESTORE" | "REMOVE";
  reason?: string;
}) {
  const post = await prisma.socialPost.findUnique({ where: { id: params.postId } });
  if (!post) throw new SocialError("Publicação não encontrada.", "NOT_FOUND", 404);

  let status: "PUBLISHED" | "HIDDEN" | "REMOVED" = "PUBLISHED";
  let deletedAt: Date | null = null;

  if (params.action === "HIDE") status = "HIDDEN";
  if (params.action === "REMOVE") {
    status = "REMOVED";
    deletedAt = new Date();
  }

  const updated = await prisma.socialPost.update({
    where: { id: params.postId },
    data: {
      status,
      deletedAt,
      moderatedAt: new Date(),
      moderatedById: params.adminId,
      moderationReason: params.reason,
    },
  });

  await writeAuditLog({
    actorId: params.adminId,
    action: "MODERATE",
    module: "social",
    resource: "social_post",
    resourceId: params.postId,
    entityBefore: post,
    entityAfter: updated,
    observation: params.reason,
  });

  if (post.authorId !== params.adminId) {
    await notifyModerationApplied({ userId: post.authorId, targetType: "post", targetId: params.postId, action: params.action });
  }

  return updated;
}

export async function moderateComment(params: {
  commentId: string;
  adminId: string;
  action: "HIDE" | "RESTORE" | "REMOVE";
  reason?: string;
}) {
  const comment = await prisma.socialComment.findUnique({ where: { id: params.commentId } });
  if (!comment) throw new SocialError("Comentário não encontrado.", "NOT_FOUND", 404);

  let status: "PUBLISHED" | "HIDDEN" | "REMOVED" = "PUBLISHED";
  let deletedAt: Date | null = null;

  if (params.action === "HIDE") status = "HIDDEN";
  if (params.action === "REMOVE") {
    status = "REMOVED";
    deletedAt = new Date();
  }

  const updated = await prisma.socialComment.update({
    where: { id: params.commentId },
    data: {
      status,
      deletedAt,
      moderatedAt: new Date(),
      moderatedById: params.adminId,
      moderationReason: params.reason,
    },
  });

  await writeAuditLog({
    actorId: params.adminId,
    action: "MODERATE",
    module: "social",
    resource: "social_comment",
    resourceId: params.commentId,
    entityBefore: comment,
    entityAfter: updated,
    observation: params.reason,
  });

  if (comment.authorId !== params.adminId) {
    await notifyModerationApplied({ userId: comment.authorId, targetType: "comment", targetId: params.commentId, action: params.action });
  }

  return updated;
}

export async function listAdminPosts(params: { status?: string; cursor?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 20, 50);
  const posts = await prisma.socialPost.findMany({
    where: params.status ? { status: params.status as "PUBLISHED" | "HIDDEN" | "REPORTED" | "REMOVED" } : undefined,
    include: {
      author: { select: { id: true, name: true, role: true } },
      _count: { select: { likes: true, comments: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  return { posts: slice, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}

export async function listAdminComments(params: { status?: string; cursor?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 20, 50);
  const comments = await prisma.socialComment.findMany({
    where: params.status ? { status: params.status as "PUBLISHED" | "HIDDEN" | "REPORTED" | "REMOVED" } : undefined,
    include: {
      author: { select: { id: true, name: true, role: true } },
      post: { select: { id: true, content: true } },
      _count: { select: { likes: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = comments.length > limit;
  const slice = hasMore ? comments.slice(0, limit) : comments;
  return { comments: slice, nextCursor: hasMore ? slice[slice.length - 1]?.id : null };
}
