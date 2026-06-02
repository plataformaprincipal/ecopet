import { Router } from "express";
import { z } from "zod";
import { AppointmentServiceType, AppointmentAttendanceMode } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  APPOINTMENT_META,
} from "../services/appointment-service.js";

const router = Router();

const createSchema = z.object({
  petId: z.string().min(1, "Selecione o pet"),
  serviceType: z.nativeEnum(AppointmentServiceType),
  attendanceMode: z.nativeEnum(AppointmentAttendanceMode),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  scheduledTime: z.string().min(1, "Horário obrigatório"),
  observations: z.string().max(2000).optional(),
});

const rescheduleSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  scheduledTime: z.string().min(1, "Horário obrigatório"),
  observations: z.string().max(2000).optional(),
});

router.get("/meta", (_req, res) => {
  res.json(APPOINTMENT_META);
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const status = req.query.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | undefined;
    res.json(await listAppointments(req.userId!, status));
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    res.json(await getAppointment(req.userId!, paramString(req.params.id)));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const created = await createAppointment({ userId: req.userId!, ...body });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/cancel", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = req.body as { reason?: string };
    res.json(await cancelAppointment(req.userId!, paramString(req.params.id), reason));
  } catch (e) {
    next(e);
  }
});

router.post("/:id/reschedule", async (req: AuthRequest, res, next) => {
  try {
    const body = rescheduleSchema.parse(req.body);
    res.json(await rescheduleAppointment(req.userId!, paramString(req.params.id), body));
  } catch (e) {
    next(e);
  }
});

export default router;
