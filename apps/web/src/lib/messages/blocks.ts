import { prisma } from "@/lib/prisma";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { ChatError } from "@/lib/messages/utils";
import { auditChatAction } from "@/lib/messages/notifications";

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
  if (blockerId === blockedId) {
    throw new ChatError("Não é possível bloquear a si mesmo.", "VALIDATION", 400);
  }
  await requireActiveChatUser(blockerId);
  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new ChatError("Usuário não encontrado.", "NOT_FOUND", 404);

  const block = await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId, reason },
    update: { reason },
  });

  await auditChatAction({
    actorId: blockerId,
    action: "CREATE",
    resource: "user_block",
    resourceId: block.id,
  });

  return block;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  await auditChatAction({
    actorId: blockerId,
    action: "DELETE",
    resource: "user_block",
    resourceId: blockedId,
  });
  return { ok: true };
}

export async function listBlockedUsers(blockerId: string) {
  const rows = await prisma.userBlock.findMany({
    where: { blockerId },
    include: { blocked: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ ...r.blocked, blockedAt: r.createdAt, reason: r.reason }));
}

export async function isBlockedBetween(userA: string, userB: string) {
  const row = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });
  return Boolean(row);
}
