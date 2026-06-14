import { Router } from "express";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { asInputJson } from "../lib/prisma-json.js";
import { getCurrentUserById } from "../services/current-user-service.js";
import { updateProfile } from "../services/auth-service.js";
import { sendSuccess, sendFailure } from "../lib/express-api-response.js";

const router = Router();

/** Perfil completo do usuário autenticado */
router.get("/profile", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await getCurrentUserById(req.userId!);
    if (!user) return sendFailure(res, "NOT_FOUND", "Usuário não encontrado", 404);
    return sendSuccess(res, { user });
  } catch (e) {
    next(e);
  }
});

router.patch("/profile", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, name, phone, bio, avatar, address } = z.object({
      currentPassword: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      address: z.object({
        street: z.string().min(3),
        number: z.string().optional(),
        complement: z.string().optional(),
        district: z.string().optional(),
        city: z.string().min(2),
        state: z.string().length(2),
        zipCode: z.string().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      }).optional(),
    }).parse(req.body);
    const result = await updateProfile({
      userId: req.userId!,
      currentPassword,
      data: { name, phone, bio, avatar, address },
      ip: req.ip,
    });
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await getCurrentUserById(req.userId!);
    if (!user) return sendFailure(res, "NOT_FOUND", "Usuário não encontrado", 404);
    return sendSuccess(res, { user });
  } catch (e) {
    next(e);
  }
});

router.patch("/me/preferences", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { a11y, locale } = req.body as { a11y?: Record<string, unknown>; locale?: string };
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const current = (user.preferences as Record<string, unknown>) ?? {};
    const updated = {
      ...current,
      ...(a11y ? { a11y } : {}),
      ...(locale ? { locale } : {}),
    };

    await prisma.user.update({
      where: { id: req.userId! },
      data: { preferences: asInputJson(updated) },
    });

    res.json({ ok: true, preferences: updated });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isVerified: true,
        isPremium: true,
        badges: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
