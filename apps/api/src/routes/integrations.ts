import { Router } from "express";
import { prisma } from "@ecopet/database";
import type { AuthRequest } from "../middleware/auth.js";
import { createAuditLog } from "../services/audit-service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { ownerId: req.userId! },
      include: { logs: { take: 5, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json(integrations);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { provider, name, config } = req.body as {
      provider: string;
      name: string;
      config?: Record<string, unknown>;
    };
    const integration = await prisma.integration.create({
      data: {
        ownerId: req.userId!,
        provider,
        name,
        config,
        status: "DISCONNECTED",
      },
    });
    await createAuditLog({
      userId: req.userId,
      action: "CREATE",
      module: "integrations",
      resource: "integration",
      resourceId: integration.id,
    });
    res.status(201).json(integration);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.integration.findFirst({
      where: { id: req.params.id, ownerId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: "Integração não encontrada" });

    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: req.body,
    });

    if (req.body.status === "CONNECTED") {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: "connect",
          status: "success",
          message: "Integração conectada",
        },
      });
    }

    await createAuditLog({
      userId: req.userId,
      action: "UPDATE",
      module: "integrations",
      resource: "integration",
      resourceId: integration.id,
      metadata: req.body,
    });
    res.json(integration);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/sync", async (req: AuthRequest, res, next) => {
  try {
    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: { status: "SYNCING", lastSyncAt: new Date() },
    });
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: "sync",
        status: "success",
        message: "Sincronização concluída",
      },
    });
    const updated = await prisma.integration.update({
      where: { id: req.params.id },
      data: { status: "CONNECTED" },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
