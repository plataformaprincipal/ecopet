import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { listUserRobots, toggleRobot, runRobot, getRobotLogs } from "../services/robots-service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    res.json(await listUserRobots(req.userId!, req.userRole ?? "TUTOR"));
  } catch (e) {
    next(e);
  }
});

router.post("/seed", async (req: AuthRequest, res, next) => {
  try {
    res.json(await listUserRobots(req.userId!, req.userRole ?? "TUTOR"));
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/toggle", async (req: AuthRequest, res, next) => {
  try {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    res.json(await toggleRobot(paramString(req.params.id), req.userId!, active));
  } catch (e) {
    if ((e as Error).message === "ROBOT_NOT_FOUND") return res.status(404).json({ error: "Robô não encontrado" });
    next(e);
  }
});

router.post("/:id/run", async (req: AuthRequest, res, next) => {
  try {
    res.json(await runRobot(paramString(req.params.id), req.userId!));
  } catch (e) {
    if ((e as Error).message === "ROBOT_NOT_FOUND") return res.status(404).json({ error: "Robô não encontrado" });
    next(e);
  }
});

router.get("/:id/logs", async (req: AuthRequest, res, next) => {
  try {
    res.json(await getRobotLogs(paramString(req.params.id), req.userId!));
  } catch (e) {
    if ((e as Error).message === "ROBOT_NOT_FOUND") return res.status(404).json({ error: "Robô não encontrado" });
    next(e);
  }
});

export default router;
