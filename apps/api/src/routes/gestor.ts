import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { requireGestor, requirePermission } from "../middleware/rbac.js";
import {
  getGestorDashboardMetrics,
  listApprovalRequests,
  reviewApproval,
  listPendingUsers,
  listModerationReports,
  resolveReport,
} from "../services/gestor-service.js";
import { createAuditLog, listAuditLogs } from "../services/audit-service.js";
import { getUserPermissions, listRbacRoles, listDepartments } from "../services/rbac-service.js";
import { listTickets, updateTicket } from "../services/ticket-service.js";
import { getModuleData, runSystemHealthCheck, seedGestorInfrastructure } from "../services/gestor-modules-service.js";
import { createGestorInvite } from "../services/auth-service.js";
import { prisma } from "@ecopet/database";

const router = Router();

router.get("/dashboard", requirePermission("gestor.dashboard.view"), async (_req, res, next) => {
  try {
    res.json(await getGestorDashboardMetrics());
  } catch (e) {
    next(e);
  }
});

router.get("/modules/:moduleId", requireGestor(), async (req, res, next) => {
  try {
    res.json(await getModuleData(paramString(req.params.moduleId)));
  } catch (e) {
    next(e);
  }
});

router.get("/approvals", requirePermission("gestor.approvals.view"), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    res.json(await listApprovalRequests(status as never, type as never));
  } catch (e) {
    next(e);
  }
});

router.patch("/approvals/:id", requirePermission("gestor.approvals.approve"), async (req: AuthRequest, res, next) => {
  try {
    const { status, notes } = req.body as { status: "APPROVED" | "REJECTED" | "REVISION"; notes?: string };
    const result = await reviewApproval(paramString(req.params.id), req.userId!, status, notes);
    await createAuditLog({
      userId: req.userId,
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      module: "gestor",
      resource: "approval",
      resourceId: paramString(req.params.id),
      metadata: { status, notes },
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/users/pending", requirePermission("gestor.approvals.view"), async (_req, res, next) => {
  try {
    res.json(await listPendingUsers());
  } catch (e) {
    next(e);
  }
});

router.get("/users/internal", requirePermission("gestor.permissions.view"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "GESTOR" },
      select: {
        id: true, name: true, email: true, username: true, accountStatus: true,
        mustChangePassword: true, createdAt: true,
        gestorProfile: true,
        department: { select: { name: true, code: true } },
        rbacAssignments: { include: { role: { select: { name: true, code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.post("/invites", requirePermission("gestor.permissions.admin"), async (req: AuthRequest, res, next) => {
  try {
    const { email, name, roleCode, departmentId } = req.body as {
      email: string; name: string; roleCode: string; departmentId?: string;
    };
    const result = await createGestorInvite({
      email, name, roleCode, departmentId, invitedById: req.userId!,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/invites", requirePermission("gestor.permissions.view"), async (_req, res, next) => {
  try {
    res.json(await prisma.gestorInvite.findMany({ orderBy: { createdAt: "desc" }, take: 50 }));
  } catch (e) {
    next(e);
  }
});

router.get("/moderation/reports", requirePermission("gestor.moderation.view"), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || "PENDING";
    res.json(await listModerationReports(status));
  } catch (e) {
    next(e);
  }
});

router.patch("/moderation/reports/:id", requirePermission("gestor.moderation.edit"), async (req: AuthRequest, res, next) => {
  try {
    const { action, status } = req.body as { action: string; status: "RESOLVED" | "DISMISSED" };
    const result = await resolveReport(paramString(req.params.id), req.userId!, action, status);
    await createAuditLog({
      userId: req.userId,
      action: "MODERATE",
      module: "gestor",
      resource: "report",
      resourceId: paramString(req.params.id),
      metadata: { action, status },
      riskLevel: action.includes("suspend") ? "high" : "medium",
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/audit", requirePermission("gestor.audit.view"), async (req, res, next) => {
  try {
    const module = req.query.module as string | undefined;
    const userId = req.query.userId as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(module ? { module } : {}),
        ...(userId ? { userId } : {}),
        ...(riskLevel ? { riskLevel } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { id: true, name: true, email: true, role: true } }, riskFlags: true },
    });
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

router.get("/audit/export", requirePermission("gestor.audit.export"), async (req: AuthRequest, res, next) => {
  try {
    const logs = await listAuditLogs({ limit: 1000 });
    await createAuditLog({ userId: req.userId, action: "EXPORT", module: "gestor", resource: "audit" });
    res.json({ exported: logs.length, data: logs });
  } catch (e) {
    next(e);
  }
});

router.get("/login-logs", requirePermission("gestor.audit.view"), async (_req, res, next) => {
  try {
    res.json(await prisma.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
  } catch (e) {
    next(e);
  }
});

router.get("/tickets", requirePermission("gestor.support.view"), async (_req, res, next) => {
  try {
    res.json(await listTickets({ isGestor: true }));
  } catch (e) {
    next(e);
  }
});

router.patch("/tickets/:id", requirePermission("gestor.support.edit"), async (req: AuthRequest, res, next) => {
  try {
    const result = await updateTicket(paramString(req.params.id), req.body);
    await createAuditLog({
      userId: req.userId,
      action: "UPDATE",
      module: "gestor",
      resource: "ticket",
      resourceId: paramString(req.params.id),
      metadata: req.body,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/permissions/me", requireGestor(), async (req: AuthRequest, res, next) => {
  try {
    const permissions = await getUserPermissions(req.userId!);
    res.json({ permissions, role: req.userRole });
  } catch (e) {
    next(e);
  }
});

router.get("/rbac/roles", requirePermission("gestor.permissions.view"), async (_req, res, next) => {
  try {
    res.json(await listRbacRoles());
  } catch (e) {
    next(e);
  }
});

router.get("/departments", requirePermission("gestor.permissions.view"), async (_req, res, next) => {
  try {
    res.json(await listDepartments());
  } catch (e) {
    next(e);
  }
});

router.post("/notifications/dispatch", requirePermission("gestor.marketing.view"), async (req: AuthRequest, res, next) => {
  try {
    const { title, body, channel, segment } = req.body as { title: string; body: string; channel: string; segment?: string };
    const dispatch = await prisma.notificationDispatch.create({
      data: { title, body, channel, segment, status: "SENT", sentAt: new Date(), createdById: req.userId },
    });
    await createAuditLog({ userId: req.userId, action: "CREATE", module: "gestor", resource: "notification", resourceId: dispatch.id });
    res.status(201).json(dispatch);
  } catch (e) {
    next(e);
  }
});

router.post("/documents", requirePermission("gestor.approvals.view"), async (req: AuthRequest, res, next) => {
  try {
    const { ownerId, ownerType, docType, title, fileUrl } = req.body as Record<string, string>;
    const doc = await prisma.platformDocument.create({
      data: { ownerId, ownerType, docType, title, fileUrl: fileUrl ?? null },
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

router.patch("/documents/:id/review", requirePermission("gestor.approvals.approve"), async (req: AuthRequest, res, next) => {
  try {
    const { action, notes } = req.body as { action: string; notes?: string };
    const doc = await prisma.platformDocument.update({
      where: { id: paramString(req.params.id) },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED", reviewedById: req.userId, reviewNotes: notes },
    });
    await prisma.documentReview.create({
      data: { documentId: doc.id, reviewerId: req.userId!, action, notes },
    });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

router.get("/system/health", requirePermission("gestor.ti.admin"), async (_req, res, next) => {
  try {
    res.json(await runSystemHealthCheck());
  } catch (e) {
    next(e);
  }
});

router.post("/system/seed-infra", requirePermission("gestor.ti.admin"), async (req: AuthRequest, res, next) => {
  try {
    await seedGestorInfrastructure(req.userId!);
    res.json({ success: true, platform: true });
  } catch (e) {
    next(e);
  }
});

router.post("/platform/seed", requirePermission("gestor.ti.admin"), async (_req, res, next) => {
  try {
    const { seedPlatformInfrastructure } = await import("../services/platform-governance-service.js");
    res.json(await seedPlatformInfrastructure());
  } catch (e) {
    next(e);
  }
});

router.get("/internal-bots", requireGestor, async (_req, res, next) => {
  try {
    const { listInternalBots } = await import("../services/internal-bots-service.js");
    res.json(await listInternalBots());
  } catch (e) {
    next(e);
  }
});

router.patch("/internal-bots/:key", requirePermission("gestor.ti.admin"), async (req: AuthRequest, res, next) => {
  try {
    const { paramString } = await import("../lib/request-utils.js");
    const { setInternalBotEnabled } = await import("../services/internal-bots-service.js");
    const { enabled } = req.body as { enabled: boolean };
    res.json(await setInternalBotEnabled(paramString(req.params.key), Boolean(enabled), req.userId));
  } catch (e) {
    next(e);
  }
});

export default router;
