import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { requireGestor, requirePermission } from "../middleware/rbac.js";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "@ecopet/database";
import {
  emitPlatformEvent,
  listFeatureFlags,
  upsertFeatureFlag,
  listWorkflows,
  createWorkflow,
  createVisualWorkflow,
  getWorkflowById,
  updateWorkflow,
  runWorkflowManually,
  getSlaDashboard,
  createSlaPolicy,
  listVersions,
  saveEntityVersion,
  getCostDashboard,
  recordCost,
  getDataLayerDashboard,
  listBusinessRules,
  createBusinessRule,
  listPlatformEvents,
  getIntelligenceDashboard,
  getObservabilityDashboard,
  triggerBackup,
  getLgpdDashboard,
  createLgpdRequest,
  recordConsent,
  getOrganizations,
  getPersonaExecutiveDashboard,
  isFeatureEnabled,
  seedPlatformInfrastructure,
} from "../services/platform-governance-service.js";
import { createAuditLog } from "../services/audit-service.js";

const router = Router();

function personaFromRole(role?: string): "CLIENT" | "PARTNER" | "NGO" | "GESTOR" {
  if (role === "GESTOR" || role === "ADMIN") return "GESTOR";
  if (["PETSHOP", "SELLER", "CLINIC", "VETERINARIAN", "SERVICE_PROVIDER"].includes(role ?? "")) return "PARTNER";
  if (role === "ONG") return "NGO";
  return "CLIENT";
}

router.use(authMiddleware);

router.get("/executive", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { role: true } });
    const persona = (req.query.persona as string) ?? personaFromRole(user?.role);
    res.json(await getPersonaExecutiveDashboard(persona as never, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/features", async (req, res, next) => {
  try {
    const scope = req.query.scope as string | undefined;
    res.json(await listFeatureFlags(scope as never));
  } catch (e) {
    next(e);
  }
});

router.get("/features/:key/enabled", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { organizationId: true } });
    res.json({ enabled: await isFeatureEnabled(req.params.key, user?.organizationId ?? undefined) });
  } catch (e) {
    next(e);
  }
});

router.post("/features", requirePermission("gestor.flags.admin"), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      key: z.string(),
      name: z.string(),
      description: z.string().optional(),
      enabled: z.boolean(),
      rolloutPct: z.number().optional(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]).optional(),
      moduleKey: z.string().optional(),
    }).parse(req.body);
    res.json(await upsertFeatureFlag(body, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/workflows", async (req, res, next) => {
  try {
    res.json(await listWorkflows(req.query.scope as never, req.query.organizationId as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post("/workflows", requirePermission("gestor.workflow.admin"), async (req: AuthRequest, res, next) => {
  try {
    const visual = z.object({
      name: z.string(),
      description: z.string().optional(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]),
      nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        label: z.string(),
        x: z.number(),
        y: z.number(),
        data: z.record(z.unknown()).optional(),
      })),
      edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string() })),
    }).safeParse(req.body);

    if (visual.success) {
      return res.status(201).json(await createVisualWorkflow(visual.data, req.userId!));
    }

    const body = z.object({
      name: z.string(),
      description: z.string().optional(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]),
      triggerType: z.string(),
      triggerConfig: z.record(z.unknown()),
      actions: z.array(z.record(z.unknown())),
    }).parse(req.body);
    res.status(201).json(await createWorkflow(body, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/workflows/:id", requirePermission("gestor.workflow.view"), async (req, res, next) => {
  try {
    res.json(await getWorkflowById(req.params.id));
  } catch (e) {
    next(e);
  }
});

router.put("/workflows/:id", requirePermission("gestor.workflow.admin"), async (req: AuthRequest, res, next) => {
  try {
    res.json(await updateWorkflow(req.params.id, req.body, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/workflows/:id/run", requirePermission("gestor.workflow.admin"), async (req: AuthRequest, res, next) => {
  try {
    res.json(await runWorkflowManually(req.params.id, req.userId!, req.body));
  } catch (e) {
    next(e);
  }
});

router.get("/sla", async (_req, res, next) => {
  try {
    res.json(await getSlaDashboard());
  } catch (e) {
    next(e);
  }
});

router.post("/sla/policies", requirePermission("gestor.sla.admin"), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]),
      entityType: z.string(),
      responseMins: z.number(),
      resolutionMins: z.number(),
    }).parse(req.body);
    res.status(201).json(await createSlaPolicy(body, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/versions/:entityType/:entityId", async (req, res, next) => {
  try {
    res.json(await listVersions(req.params.entityType, req.params.entityId));
  } catch (e) {
    next(e);
  }
});

router.post("/versions", async (req: AuthRequest, res, next) => {
  try {
    const { entityType, entityId, snapshot, changeNote } = z.object({
      entityType: z.string(),
      entityId: z.string(),
      snapshot: z.record(z.unknown()),
      changeNote: z.string().optional(),
    }).parse(req.body);
    res.status(201).json(await saveEntityVersion({ entityType, entityId, snapshot, changeNote, authorId: req.userId! }));
  } catch (e) {
    next(e);
  }
});

router.get("/costs", requirePermission("gestor.costs.view"), async (req, res, next) => {
  try {
    res.json(await getCostDashboard(req.query.organizationId as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post("/costs", requirePermission("gestor.costs.admin"), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      category: z.string(),
      amount: z.number(),
      moduleKey: z.string().optional(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]).optional(),
    }).parse(req.body);
    res.status(201).json(await recordCost({ ...body, userId: req.userId! }));
  } catch (e) {
    next(e);
  }
});

router.get("/data-layer", requirePermission("gestor.data.view"), async (_req, res, next) => {
  try {
    res.json(await getDataLayerDashboard());
  } catch (e) {
    next(e);
  }
});

router.get("/rules", async (req, res, next) => {
  try {
    res.json(await listBusinessRules(req.query.scope as never));
  } catch (e) {
    next(e);
  }
});

router.post("/rules", requirePermission("gestor.rules.admin"), async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string(),
      description: z.string().optional(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]),
      condition: z.record(z.unknown()),
      action: z.record(z.unknown()),
      priority: z.number().optional(),
    }).parse(req.body);
    res.status(201).json(await createBusinessRule(body, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/events", async (req, res, next) => {
  try {
    res.json(await listPlatformEvents({
      eventType: req.query.eventType as string | undefined,
      personaScope: req.query.scope as never,
      limit: Number(req.query.limit) || 50,
    }));
  } catch (e) {
    next(e);
  }
});

router.post("/events", async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      eventType: z.string(),
      personaScope: z.enum(["CLIENT", "PARTNER", "NGO", "GESTOR", "GLOBAL"]).optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
      payload: z.record(z.unknown()).optional(),
    }).parse(req.body);
    res.status(201).json(await emitPlatformEvent({ ...body, actorId: req.userId! }));
  } catch (e) {
    next(e);
  }
});

router.get("/intelligence", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { role: true } });
    const scope = (req.query.scope as string) ?? personaFromRole(user?.role);
    if (scope === "GESTOR") {
      return res.json(await getIntelligenceDashboard("GESTOR"));
    }
    res.json(await getPersonaExecutiveDashboard(scope as never, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/observability", requirePermission("gestor.observability.view"), async (_req, res, next) => {
  try {
    res.json(await getObservabilityDashboard());
  } catch (e) {
    next(e);
  }
});

router.post("/backups", requirePermission("gestor.backup.admin"), async (req: AuthRequest, res, next) => {
  try {
    const { type } = z.object({ type: z.string().default("manual") }).parse(req.body);
    res.status(201).json(await triggerBackup(type, req.userId!));
  } catch (e) {
    next(e);
  }
});

router.get("/backups", requirePermission("gestor.backup.view"), async (_req, res, next) => {
  try {
    res.json(await prisma.backupJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 }));
  } catch (e) {
    next(e);
  }
});

router.get("/lgpd", async (req: AuthRequest, res, next) => {
  try {
    const isGestor = req.userRole === "GESTOR" || req.userRole === "ADMIN";
    res.json(await getLgpdDashboard(isGestor ? undefined : req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/lgpd/requests", async (req: AuthRequest, res, next) => {
  try {
    const { type, notes } = z.object({
      type: z.enum(["EXPORT", "DELETE", "ANONYMIZE", "ACCESS"]),
      notes: z.string().optional(),
    }).parse(req.body);
    const result = await createLgpdRequest(req.userId!, type, notes);
    await createAuditLog({ userId: req.userId!, action: "CREATE", module: "lgpd", resource: "request", resourceId: result.id });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/lgpd/consent", async (req: AuthRequest, res, next) => {
  try {
    const { consentType, granted } = z.object({ consentType: z.string(), granted: z.boolean() }).parse(req.body);
    res.json(await recordConsent(req.userId!, consentType, granted, req.ip));
  } catch (e) {
    next(e);
  }
});

router.get("/organizations", requireGestor(), async (req, res, next) => {
  try {
    res.json(await getOrganizations(req.query.type as string | undefined));
  } catch (e) {
    next(e);
  }
});

router.post("/seed", requirePermission("gestor.ti.admin"), async (_req, res, next) => {
  try {
    res.json(await seedPlatformInfrastructure());
  } catch (e) {
    next(e);
  }
});

export default router;
