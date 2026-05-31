import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import {
  getOrCreatePartnerLogistics,
  getAvailableDeliveryMethods,
  calculateShipping,
  updatePartnerLogistics,
} from "../services/logistics-service.js";

const router = Router();

router.get("/partner/:partnerId", async (req, res, next) => {
  try {
    const config = await getOrCreatePartnerLogistics(req.params.partnerId);
    const methods = getAvailableDeliveryMethods(config);
    res.json({ config, methods });
  } catch (e) {
    next(e);
  }
});

router.post("/calculate", async (req, res, next) => {
  try {
    const { partnerId, method } = z.object({
      partnerId: z.string(),
      method: z.enum([
        "PICKUP_LOCAL", "DELIVERY_LOCAL", "DELIVERY_REGIONAL", "DELIVERY_NATIONAL",
        "DELIVERY_OWN", "DELIVERY_PARTNER_LOGISTICS", "DELIVERY_SCHEDULED", "PICKUP_SCHEDULED",
      ]),
    }).parse(req.body);
    const result = await calculateShipping(partnerId, method);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put("/partner/:partnerId", async (req: AuthRequest, res, next) => {
  try {
    if (req.userId !== req.params.partnerId && req.userRole !== "ADMIN" && req.userRole !== "GESTOR") {
      return res.status(403).json({ error: "Apenas o parceiro pode configurar logística" });
    }
    const config = await updatePartnerLogistics(req.params.partnerId, req.body);
    res.json(config);
  } catch (e) {
    next(e);
  }
});

export default router;
