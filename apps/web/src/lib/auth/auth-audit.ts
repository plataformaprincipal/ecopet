import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

type AuditMeta = Record<string, unknown>;

async function safeAudit(fn: () => Promise<void>) {
  try {
    await fn();
  } catch {
    /* auditoria não deve interromper fluxo principal */
  }
}

export async function auditLogin(params: {
  userId: string;
  email?: string;
  ip?: string;
  userAgent?: string;
}) {
  await safeAudit(async () => {
    await prisma.loginLog.create({
      data: {
        userId: params.userId,
        email: params.email,
        success: true,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
    await writeAuditLog({
      actorId: params.userId,
      action: "LOGIN",
      module: "auth",
      resource: "session",
      resourceId: params.userId,
      observation: "Login realizado com sucesso",
      metadata: { ip: params.ip, userAgent: params.userAgent },
    });
  });
}

export async function auditLogout(params: { userId?: string | null }) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.userId ?? null,
      action: "LOGOUT",
      module: "auth",
      resource: "session",
      resourceId: params.userId ?? undefined,
      observation: "Logout realizado",
    });
  });
}

export async function auditLoginFailed(params: {
  userId?: string | null;
  identifier?: string;
  reason: string;
  ip?: string;
  userAgent?: string;
}) {
  await safeAudit(async () => {
    await prisma.loginLog.create({
      data: {
        userId: params.userId ?? null,
        email: params.identifier?.includes("@") ? params.identifier : undefined,
        username: params.identifier?.includes("@") ? undefined : params.identifier,
        success: false,
        ip: params.ip,
        userAgent: params.userAgent,
        reason: params.reason,
      },
    });
    await writeAuditLog({
      actorId: params.userId ?? null,
      action: "VIEW",
      module: "auth",
      resource: "login_attempt",
      resourceId: params.userId ?? undefined,
      observation: `login_failed:${params.reason}`,
      metadata: {
        identifier: params.identifier,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  });
}

export async function auditAdminAccess(params: { userId: string; path?: string }) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.userId,
      action: "VIEW",
      module: "admin",
      resource: "admin_panel",
      resourceId: params.userId,
      observation: "Acesso ao painel administrativo",
      metadata: { path: params.path },
    });
  });
}

export async function auditAdminAccessDenied(params: { userId?: string; path?: string }) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.userId ?? null,
      action: "VIEW",
      module: "admin",
      resource: "admin_panel",
      resourceId: params.userId,
      observation: "Tentativa de acesso administrativo negada",
      metadata: { path: params.path },
    });
  });
}

export async function auditRoleChange(params: {
  actorId: string;
  targetUserId: string;
  before: AuditMeta;
  after: AuditMeta;
  observation?: string;
}) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.actorId,
      action: "UPDATE",
      module: "admin.users",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: params.before,
      entityAfter: params.after,
      observation: params.observation ?? "Mudança de role",
    });
  });
}

export async function auditPermissionChange(params: {
  actorId: string;
  resourceId: string;
  before: AuditMeta;
  after: AuditMeta;
  observation?: string;
}) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.actorId,
      action: "UPDATE",
      module: "admin.permissions",
      resource: "Permission",
      resourceId: params.resourceId,
      entityBefore: params.before,
      entityAfter: params.after,
      observation: params.observation ?? "Mudança de permissões",
    });
  });
}

export async function auditSuspension(params: {
  actorId: string;
  targetUserId: string;
  before: AuditMeta;
  after: AuditMeta;
  reason?: string;
}) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.actorId,
      action: "MODERATE",
      module: "admin.users",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: params.before,
      entityAfter: params.after,
      observation: params.reason ?? "Conta suspensa",
    });
  });
}

export async function auditReactivation(params: {
  actorId: string;
  targetUserId: string;
  before: AuditMeta;
  after: AuditMeta;
  reason?: string;
}) {
  await safeAudit(async () => {
    await writeAuditLog({
      actorId: params.actorId,
      action: "APPROVE",
      module: "admin.users",
      resource: "User",
      resourceId: params.targetUserId,
      entityBefore: params.before,
      entityAfter: params.after,
      observation: params.reason ?? "Conta reativada",
    });
  });
}
