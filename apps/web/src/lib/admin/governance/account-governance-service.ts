import { AccountStatus, UserRole, type UserRole as UserRoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { updateGestorUserStatus } from "@/lib/gestor/gestor-users-service";
import { reviewAccount } from "@/lib/admin/accounts-service";
import { loadGovernanceStore, saveGovernanceStore, type UserWarningRecord } from "./store";

export type AccountGovernanceAction =
  | "warn"
  | "suspend"
  | "reactivate"
  | "temp_block"
  | "permanent_block"
  | "deactivate"
  | "anonymize"
  | "force_logout"
  | "change_role"
  | "change_status"
  | "approve"
  | "reject";

const DESTRUCTIVE = new Set<AccountGovernanceAction>(["permanent_block", "anonymize", "deactivate"]);

export function isDestructiveAccountAction(action: AccountGovernanceAction) {
  return DESTRUCTIVE.has(action);
}

export async function getAccountGovernanceDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      accountStatusReason: true,
      createdAt: true,
      publicSocialProfile: { select: { displayName: true, bio: true, avatarUrl: true, visibility: true } },
      partnerProfile: { select: { businessName: true, verificationStatus: true, cnpj: true } },
      ongProfile: { select: { ongName: true, verificationStatus: true, cnpj: true } },
    },
  });
  if (!user) return null;

  const [pets, orders, posts, comments, reports, tickets, sessions, logins, store] = await Promise.all([
    prisma.pet.count({ where: { OR: [{ ownerId: userId }, { ongId: userId }] } }),
    prisma.order.count({ where: { OR: [{ userId }, { partnerId: userId }] } }),
    prisma.socialPost.count({ where: { authorId: userId, deletedAt: null } }).catch(() => 0),
    prisma.socialComment.count({ where: { authorId: userId, deletedAt: null } }).catch(() => 0),
    prisma.socialReport.count({ where: { reporterId: userId } }),
    prisma.supportTicket.count({ where: { requesterId: userId } }),
    prisma.userSession.findMany({
      where: { userId, active: true, expiresAt: { gt: new Date() } },
      select: { id: true, device: true, ip: true, lastSeenAt: true, createdAt: true },
      take: 10,
    }),
    prisma.loginLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, success: true, ip: true, createdAt: true, reason: true },
    }),
    loadGovernanceStore(),
  ]);

  const warnings = store.warnings.filter((w) => w.userId === userId);

  return {
    user,
    warnings,
    tempBlock: store.tempBlocks[userId] ?? null,
    counts: { pets, orders, posts, comments, reports, tickets },
    sessions,
    logins,
  };
}

export async function performAccountGovernanceAction(params: {
  adminId: string;
  adminName?: string;
  targetUserId: string;
  action: AccountGovernanceAction;
  reason: string;
  severity?: UserWarningRecord["severity"];
  warningType?: UserWarningRecord["type"];
  expiresAt?: string;
  newRole?: UserRoleType;
  newStatus?: AccountStatus;
  confirmed?: boolean;
}) {
  if (!params.reason?.trim()) throw new Error("REASON_REQUIRED");
  if (params.adminId === params.targetUserId) throw new Error("SELF_ACTION");
  if (isDestructiveAccountAction(params.action) && !params.confirmed) throw new Error("CONFIRMATION_REQUIRED");

  const target = await prisma.user.findUnique({ where: { id: params.targetUserId } });
  if (!target) throw new Error("NOT_FOUND");

  const before = {
    accountStatus: target.accountStatus,
    role: target.role,
    name: target.name,
  };

  if (params.action === "warn") {
    const store = await loadGovernanceStore();
    const warning: UserWarningRecord = {
      id: `warn-${Date.now()}`,
      userId: params.targetUserId,
      type: params.warningType ?? "media",
      severity: params.severity ?? "medium",
      reason: params.reason.trim(),
      adminId: params.adminId,
      adminName: params.adminName,
      createdAt: new Date().toISOString(),
      expiresAt: params.expiresAt,
      status: "ativa",
    };
    store.warnings.push(warning);
    const graveCount = store.warnings.filter(
      (w) => w.userId === params.targetUserId && w.type === "grave" && w.status === "ativa"
    ).length;
    if (graveCount >= 3) {
      await updateGestorUserStatus({
        userId: params.targetUserId,
        action: "suspend",
        reason: "Suspensão automática por reincidência de advertências graves",
        adminId: params.adminId,
      });
    }
    await saveGovernanceStore(store);
    await writeAuditLog({
      actorId: params.adminId,
      action: "MODERATE",
      module: "admin.governance.accounts",
      resource: "UserWarning",
      resourceId: warning.id,
      entityBefore: before,
      entityAfter: warning,
      observation: params.reason.trim(),
      metadata: { userId: params.targetUserId, severity: warning.severity },
    });
    return { warning, autoSuspended: graveCount >= 3 };
  }

  if (params.action === "approve" || params.action === "reject") {
    if (target.role !== UserRole.PARTNER && target.role !== UserRole.ONG) {
      throw new Error("INVALID_ROLE_FOR_REVIEW");
    }
    return reviewAccount({
      targetUserId: params.targetUserId,
      action: params.action,
      reason: params.reason,
      adminId: params.adminId,
    });
  }

  if (params.action === "reactivate" || params.action === "suspend") {
    if (
      params.action === "suspend" &&
      (target.role === UserRole.PARTNER || target.role === UserRole.ONG)
    ) {
      return reviewAccount({
        targetUserId: params.targetUserId,
        action: "suspend",
        reason: params.reason,
        adminId: params.adminId,
      });
    }
    return updateGestorUserStatus({
      userId: params.targetUserId,
      action: params.action === "reactivate" ? "reactivate" : "suspend",
      reason: params.reason,
      adminId: params.adminId,
    });
  }

  if (params.action === "temp_block") {
    const store = await loadGovernanceStore();
    const until = params.expiresAt ?? new Date(Date.now() + 7 * 86400000).toISOString();
    store.tempBlocks[params.targetUserId] = { until, reason: params.reason.trim() };
    await saveGovernanceStore(store);
    await prisma.user.update({
      where: { id: params.targetUserId },
      data: { accountStatus: AccountStatus.SUSPENDED, accountStatusReason: `Bloqueio temporário até ${until}: ${params.reason.trim()}` },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "MODERATE",
      module: "admin.governance.accounts",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { accountStatus: AccountStatus.SUSPENDED, tempBlockUntil: until },
      observation: params.reason.trim(),
    });
    return { accountStatus: AccountStatus.SUSPENDED, until };
  }

  if (params.action === "permanent_block") {
    await prisma.user.update({
      where: { id: params.targetUserId },
      data: { accountStatus: AccountStatus.REJECTED, accountStatusReason: params.reason.trim() },
    });
    await prisma.userSession.updateMany({ where: { userId: params.targetUserId }, data: { active: false } });
    await writeAuditLog({
      actorId: params.adminId,
      action: "REJECT",
      module: "admin.governance.accounts",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { accountStatus: AccountStatus.REJECTED },
      observation: params.reason.trim(),
      metadata: { riskLevel: "high" },
    });
    return { accountStatus: AccountStatus.REJECTED };
  }

  if (params.action === "deactivate") {
    await prisma.user.update({
      where: { id: params.targetUserId },
      data: {
        accountStatus: AccountStatus.SUSPENDED,
        accountStatusReason: `Conta desativada (soft): ${params.reason.trim()}`,
      },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "MODERATE",
      module: "admin.governance.accounts",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { deactivated: true },
      observation: params.reason.trim(),
    });
    return { accountStatus: AccountStatus.SUSPENDED, deactivated: true };
  }

  if (params.action === "anonymize") {
    const anonEmail = `removed+${params.targetUserId.slice(0, 8)}@anon.ecopet.local`;
    await prisma.user.update({
      where: { id: params.targetUserId },
      data: {
        name: "Usuário removido",
        email: anonEmail,
        accountStatus: AccountStatus.SUSPENDED,
        accountStatusReason: `Anonimizado: ${params.reason.trim()}`,
        phone: null,
        socialLinks: undefined,
      },
    });
    await prisma.userSession.updateMany({ where: { userId: params.targetUserId }, data: { active: false } });
    await writeAuditLog({
      actorId: params.adminId,
      action: "DELETE",
      module: "admin.governance.accounts",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { anonymized: true },
      observation: params.reason.trim(),
      metadata: { riskLevel: "high" },
    });
    return { anonymized: true };
  }

  if (params.action === "force_logout") {
    const result = await prisma.userSession.updateMany({
      where: { userId: params.targetUserId, active: true },
      data: { active: false },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "MODERATE",
      module: "admin.governance.accounts",
      resource: "UserSession",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { sessionsClosed: result.count },
      observation: params.reason.trim(),
    });
    return { sessionsClosed: result.count };
  }

  if (params.action === "change_role" && params.newRole) {
    await prisma.user.update({ where: { id: params.targetUserId }, data: { role: params.newRole } });
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.accounts",
      resource: "User.role",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { role: params.newRole },
      observation: params.reason.trim(),
      metadata: { riskLevel: "high" },
    });
    return { role: params.newRole };
  }

  if (params.action === "change_status" && params.newStatus) {
    await prisma.user.update({
      where: { id: params.targetUserId },
      data: { accountStatus: params.newStatus, accountStatusReason: params.reason.trim() },
    });
    await writeAuditLog({
      actorId: params.adminId,
      action: "UPDATE",
      module: "admin.governance.accounts",
      resource: "User.accountStatus",
      resourceId: params.targetUserId,
      entityBefore: before,
      entityAfter: { accountStatus: params.newStatus },
      observation: params.reason.trim(),
    });
    return { accountStatus: params.newStatus };
  }

  throw new Error("INVALID_ACTION");
}
