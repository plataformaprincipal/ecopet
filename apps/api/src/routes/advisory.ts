import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { requireAdvisoryAccess } from "../middleware/advisory.js";
import {
  getAdvisoryDashboard,
  generateAdvisoryInsights,
  getMarketplaceAdvisoryServices,
} from "../services/advisory-service.js";

const router = Router();

router.use(requireAdvisoryAccess());

router.get("/dashboard", async (req: AuthRequest, res, next) => {
  try {
    const dashboard = await getAdvisoryDashboard(req.userId!, req.userRole!);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

router.get("/robots", async (req: AuthRequest, res, next) => {
  try {
    const dashboard = await getAdvisoryDashboard(req.userId!, req.userRole!);
    res.json(dashboard.robots);
  } catch (e) {
    next(e);
  }
});

router.get("/insights", async (req: AuthRequest, res, next) => {
  try {
    const dashboard = await getAdvisoryDashboard(req.userId!, req.userRole!);
    res.json(dashboard.subscription.insights);
  } catch (e) {
    next(e);
  }
});

router.post("/insights/generate", async (req: AuthRequest, res, next) => {
  try {
    const insights = await generateAdvisoryInsights(req.userId!, req.userRole!);
    res.json(insights);
  } catch (e) {
    next(e);
  }
});

router.get("/marketplace", async (_req, res, next) => {
  try {
    const services = await getMarketplaceAdvisoryServices();
    res.json(services);
  } catch (e) {
    next(e);
  }
});

export default router;
