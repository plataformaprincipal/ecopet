import {
  AccountStatus,
  ApprovalStatus,
  ApprovalType,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { sendTransactionalEmail } from "@/lib/mail/transactional";

const partnerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  cnpj: true,
  accountStatus: true,
  accountStatusReason: true,
  createdAt: true,
  partnerProfile: {
    select: {
      businessName: true,
      legalName: true,
      cnpj: true,
      category: true,
      address: true,
      city: true,
      state: true,
      verificationStatus: true,
    },
  },
} as const;

const ongSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  cnpj: true,
  accountStatus: true,
  accountStatusReason: true,
  createdAt: true,
  ongProfile: {
    select: {
      ongName: true,
      cnpj: true,
      responsibleName: true,
      institutionalEmail: true,
      address: true,
      city: true,
      state: true,
      verificationStatus: true,
    },
  },
} as const;

export async function listPendingPartners() {
  return prisma.user.findMany({
    where: { role: UserRole.PARTNER, accountStatus: AccountStatus.PENDING },
    select: partnerSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingOngs() {
  return prisma.user.findMany({
    where: { role: UserRole.ONG, accountStatus: AccountStatus.PENDING },
    select: ongSelect,
    orderBy: { createdAt: "asc" },
  });
}

export async function listPartnersByStatus(status?: AccountStatus) {
  return prisma.user.findMany({
    where: {
      role: UserRole.PARTNER,
      ...(status ? { accountStatus: status } : {}),
    },
    select: partnerSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function listOngsByStatus(status?: AccountStatus) {
  return prisma.user.findMany({
    where: {
      role: UserRole.ONG,
      ...(status ? { accountStatus: status } : {}),
    },
    select: ongSelect,
    orderBy: { createdAt: "desc" },
  });
}

type ReviewAction = "approve" | "reject" | "suspend";

export async function reviewAccount(params: {
  targetUserId: string;
  action: ReviewAction;
  reason?: string;
  adminId: string;
}) {
  const target = await prisma.user.findUnique({
    where: { id: params.targetUserId },
    include: { partnerProfile: true, ongProfile: true },
  });

  if (!target) {
    throw new Error("NOT_FOUND");
  }

  if (target.role !== UserRole.PARTNER && target.role !== UserRole.ONG) {
    throw new Error("INVALID_ROLE");
  }

  const before = {
    accountStatus: target.accountStatus,
    accountStatusReason: target.accountStatusReason,
  };

  if (params.action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          accountStatus: AccountStatus.ACTIVE,
          accountStatusReason: null,
        },
      });

      if (target.role === UserRole.PARTNER && target.partnerProfile) {
        await tx.partnerProfile.update({
          where: { userId: target.id },
          data: { verificationStatus: VerificationStatus.APPROVED },
        });
      }

      if (target.role === UserRole.ONG && target.ongProfile) {
        await tx.ongProfile.update({
          where: { userId: target.id },
          data: { verificationStatus: VerificationStatus.APPROVED },
        });
      }

      await tx.approvalRequest.updateMany({
        where: {
          requesterId: target.id,
          status: ApprovalStatus.PENDING,
          type: target.role === UserRole.PARTNER ? ApprovalType.PARTNER : ApprovalType.ONG,
        },
        data: {
          status: ApprovalStatus.APPROVED,
          reviewerId: params.adminId,
          reviewedAt: new Date(),
          notes: params.reason ?? null,
        },
      });
    });

    await writeAuditLog({
      actorId: params.adminId,
      action: "APPROVE",
      module: "admin.accounts",
      resource: "User",
      resourceId: target.id,
      entityBefore: before,
      entityAfter: { accountStatus: AccountStatus.ACTIVE },
      observation: params.reason,
    });

    const approveEvent = target.role === UserRole.PARTNER ? "PARTNER_APPROVED" : "ONG_APPROVED";
    await sendTransactionalEmail({
      event: approveEvent,
      to: target.email,
      subject: "Conta aprovada — EcoPet",
      text: `Olá ${target.name}, sua conta foi aprovada.`,
      html: `<p>Olá <strong>${target.name}</strong>, sua conta foi <strong>aprovada</strong>.</p>`,
    });

    return { accountStatus: AccountStatus.ACTIVE };
  }

  if (params.action === "reject") {
    if (!params.reason?.trim()) {
      throw new Error("REASON_REQUIRED");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          accountStatus: AccountStatus.REJECTED,
          accountStatusReason: params.reason!.trim(),
        },
      });

      if (target.role === UserRole.PARTNER && target.partnerProfile) {
        await tx.partnerProfile.update({
          where: { userId: target.id },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });
      }

      if (target.role === UserRole.ONG && target.ongProfile) {
        await tx.ongProfile.update({
          where: { userId: target.id },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });
      }

      await tx.approvalRequest.updateMany({
        where: {
          requesterId: target.id,
          status: ApprovalStatus.PENDING,
        },
        data: {
          status: ApprovalStatus.REJECTED,
          reviewerId: params.adminId,
          reviewedAt: new Date(),
          notes: params.reason!.trim(),
        },
      });
    });

    await writeAuditLog({
      actorId: params.adminId,
      action: "REJECT",
      module: "admin.accounts",
      resource: "User",
      resourceId: target.id,
      entityBefore: before,
      entityAfter: {
        accountStatus: AccountStatus.REJECTED,
        accountStatusReason: params.reason!.trim(),
      },
      observation: params.reason!.trim(),
    });

    const rejectEvent = target.role === UserRole.PARTNER ? "PARTNER_REJECTED" : "ONG_REJECTED";
    await sendTransactionalEmail({
      event: rejectEvent,
      to: target.email,
      subject: "Conta não aprovada — EcoPet",
      text: `Olá ${target.name}, sua solicitação não foi aprovada. Motivo: ${params.reason!.trim()}`,
      html: `<p>Olá <strong>${target.name}</strong>, sua solicitação não foi aprovada.</p><p>Motivo: ${params.reason!.trim()}</p>`,
    });

    return { accountStatus: AccountStatus.REJECTED };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        accountStatus: AccountStatus.SUSPENDED,
        accountStatusReason: params.reason?.trim() || "Conta suspensa pela administração.",
      },
    });

    await tx.approvalRequest.updateMany({
      where: { requesterId: target.id, status: ApprovalStatus.PENDING },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewerId: params.adminId,
        reviewedAt: new Date(),
        notes: params.reason ?? "Suspensão administrativa",
      },
    });
  });

  await writeAuditLog({
    actorId: params.adminId,
    action: "MODERATE",
    module: "admin.accounts",
    resource: "User",
    resourceId: target.id,
    entityBefore: before,
    entityAfter: { accountStatus: AccountStatus.SUSPENDED },
    observation: params.reason,
  });

  const suspendEvent = target.role === UserRole.PARTNER ? "PARTNER_SUSPENDED" : "ONG_SUSPENDED";
  await sendTransactionalEmail({
    event: suspendEvent,
    to: target.email,
    subject: "Conta suspensa — EcoPet",
    text: `Olá ${target.name}, sua conta foi suspensa.`,
    html: `<p>Olá <strong>${target.name}</strong>, sua conta foi <strong>suspensa</strong>.</p>`,
  });

  return { accountStatus: AccountStatus.SUSPENDED };
}
