import { createInternalNotification } from "@/lib/notifications/internal";
import { prisma } from "@/lib/prisma";
import { buildPostShareLink } from "@/lib/social/utils";

async function getActorName(userId: string) {
  const profile = await prisma.publicProfile.findUnique({
    where: { userId },
    select: { displayName: true },
  });
  if (profile) return profile.displayName;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return user?.name ?? "Alguém";
}

export async function notifyPostLiked(params: {
  postId: string;
  likerId: string;
  postAuthorId: string;
}) {
  if (params.likerId === params.postAuthorId) return;
  const name = await getActorName(params.likerId);
  await createInternalNotification({
    userId: params.postAuthorId,
    title: "Nova curtida",
    body: `${name} curtiu sua publicação.`,
    type: "social_post_liked",
    data: { postId: params.postId, likerId: params.likerId, category: "social" },
  });
}

export async function notifyPostCommented(params: {
  postId: string;
  commenterId: string;
  postAuthorId: string;
}) {
  if (params.commenterId === params.postAuthorId) return;
  const name = await getActorName(params.commenterId);
  await createInternalNotification({
    userId: params.postAuthorId,
    title: "Novo comentário",
    body: `${name} comentou sua publicação.`,
    type: "social_post_commented",
    data: { postId: params.postId, commenterId: params.commenterId, category: "social" },
  });
}

export async function notifyCommentReplied(params: {
  commentId: string;
  postId: string;
  replierId: string;
  parentAuthorId: string;
}) {
  if (params.replierId === params.parentAuthorId) return;
  const name = await getActorName(params.replierId);
  await createInternalNotification({
    userId: params.parentAuthorId,
    title: "Nova resposta",
    body: `${name} respondeu seu comentário.`,
    type: "social_comment_replied",
    data: { postId: params.postId, commentId: params.commentId, replierId: params.replierId, category: "social" },
  });
}

export async function notifyPostShared(params: {
  postId: string;
  sharerId: string;
  postAuthorId: string;
}) {
  if (params.sharerId === params.postAuthorId) return;
  const name = await getActorName(params.sharerId);
  await createInternalNotification({
    userId: params.postAuthorId,
    title: "Publicação compartilhada",
    body: `${name} compartilhou sua publicação.`,
    type: "social_post_shared",
    data: { postId: params.postId, sharerId: params.sharerId, link: buildPostShareLink(params.postId), category: "social" },
  });
}

export async function notifyNewFollower(params: { followerId: string; followingId: string }) {
  const name = await getActorName(params.followerId);
  await createInternalNotification({
    userId: params.followingId,
    title: "Novo seguidor",
    body: `${name} começou a seguir você.`,
    type: "social_new_follower",
    data: { followerId: params.followerId, category: "social" },
  });
}

export async function notifyReportReceived(params: { adminId: string; reportId: string }) {
  await createInternalNotification({
    userId: params.adminId,
    title: "Nova denúncia social",
    body: "Uma denúncia aguarda revisão na moderação social.",
    type: "social_report_received",
    data: { reportId: params.reportId, category: "social" },
  });
}

export async function notifyModerationApplied(params: {
  userId: string;
  targetType: "post" | "comment";
  targetId: string;
  action: string;
}) {
  await createInternalNotification({
    userId: params.userId,
    title: "Moderação aplicada",
    body: `Sua ${params.targetType === "post" ? "publicação" : "comentário"} foi ${params.action === "RESTORE" ? "restaurada" : "moderada"}.`,
    type: "social_moderation_applied",
    data: { targetType: params.targetType, targetId: params.targetId, action: params.action, category: "social" },
  });
}
