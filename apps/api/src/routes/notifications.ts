import { Router } from "express";
import { prisma } from "@ecopet/database";
import { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(
      notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.message ?? n.body,
        message: n.message ?? n.body,
        type: n.type,
        read: Boolean(n.readAt) || n.read,
        readAt: n.readAt,
        actionUrl: n.actionUrl,
        data: n.metadata ?? n.data,
        metadata: n.metadata ?? n.data,
        priority: n.priority,
        createdAt: n.createdAt,
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: paramString(req.params.id), userId: req.userId, deletedAt: null },
      data: { read: true, readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
