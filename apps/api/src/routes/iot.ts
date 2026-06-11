import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import {
  getIotDashboard,
  registerDevice,
  ingestReading,
  simulateReading,
  getDeviceReadings,
  listUserAlerts,
  listAgroUnits,
  createAgroUnit,
  registerAgroSensor,
  IOT_DISCLAIMER,
} from "../services/iot-service.js";

const router = Router();

router.get("/dashboard", async (req: AuthRequest, res, next) => {
  try {
    const { petId, agroUnitId } = req.query;
    res.json(
      await getIotDashboard(req.userId!, req.userRole, {
        petId: petId ? String(petId) : undefined,
        agroUnitId: agroUnitId ? String(agroUnitId) : undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get("/devices", async (req: AuthRequest, res, next) => {
  try {
    const dash = await getIotDashboard(req.userId!, req.userRole);
    res.json({ devices: dash.devices, disclaimer: IOT_DISCLAIMER });
  } catch (e) {
    next(e);
  }
});

router.post("/devices", async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        name: z.string().min(2),
        deviceType: z.string().min(2),
        ownerType: z.enum(["pet", "agro"]),
        petId: z.string().optional(),
        agroUnitId: z.string().optional(),
        location: z.string().optional(),
        isDemo: z.boolean().optional(),
      })
      .parse(req.body);
    const device = await registerDevice({ ...data, userId: req.userId! });
    res.status(201).json(device);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "PET_NOT_FOUND") return res.status(404).json({ error: "Pet não encontrado" });
    if (msg === "AGRO_UNIT_NOT_FOUND") return res.status(404).json({ error: "Unidade AgroPet não encontrada" });
    next(e);
  }
});

router.get("/devices/:id/readings", async (req: AuthRequest, res, next) => {
  try {
    res.json(await getDeviceReadings(paramString(req.params.id), req.userId!, req.userRole));
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") return res.status(403).json({ error: "Acesso negado" });
    next(e);
  }
});

router.post("/devices/:id/simulate", async (req: AuthRequest, res, next) => {
  try {
    const { metricKey } = z.object({ metricKey: z.string().optional() }).parse(req.body ?? {});
    res.json(await simulateReading(paramString(req.params.id), req.userId!, metricKey, req.userRole));
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") return res.status(403).json({ error: "Acesso negado" });
    next(e);
  }
});

router.get("/alerts", async (req: AuthRequest, res, next) => {
  try {
    res.json(await listUserAlerts(req.userId!, req.userRole));
  } catch (e) {
    next(e);
  }
});

router.post("/readings", async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({
        deviceId: z.string(),
        userId: z.string().optional(),
        petId: z.string().optional(),
        agroUnitId: z.string().optional(),
        type: z.string().optional(),
        metricKey: z.string(),
        value: z.number(),
        unit: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        battery: z.number().optional(),
        timestamp: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(req.body);

    if (req.userRole !== "GESTOR" && req.userRole !== "ADMIN" && data.userId && data.userId !== req.userId) {
      return res.status(403).json({ error: "Não é permitido enviar leituras para outro usuário" });
    }

    res.status(201).json(
      await ingestReading({
        ...data,
        userId: data.userId ?? req.userId!,
        role: req.userRole,
      })
    );
  } catch (e) {
    if ((e as Error).message === "FORBIDDEN") return res.status(403).json({ error: "Acesso negado" });
    next(e);
  }
});

router.get("/agro/units", async (req: AuthRequest, res, next) => {
  try {
    res.json(await listAgroUnits(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/agro/units", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({ name: z.string().min(2), location: z.string().optional(), areaHa: z.number().optional() }).parse(req.body);
    res.status(201).json(await createAgroUnit(req.userId!, data));
  } catch (e) {
    next(e);
  }
});

router.post("/agro/units/:id/sensors", async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({ name: z.string().min(2), sensorType: z.string().min(2) }).parse(req.body);
    res.status(201).json(await registerAgroSensor(paramString(req.params.id), req.userId!, data));
  } catch (e) {
    if ((e as Error).message === "AGRO_UNIT_NOT_FOUND") return res.status(404).json({ error: "Unidade não encontrada" });
    next(e);
  }
});

export default router;
