import { Router } from "express";
import { prisma } from "@ecopet/database";
import { AuthRequest } from "../middleware/auth.js";
import { asInputJson } from "../lib/prisma-json.js";

const router = Router();

router.get("/me", async (req: AuthRequest, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const jwt = await import("jsonwebtoken");
    const payload = jwt.default.verify(
      header.slice(7),
      process.env.JWT_SECRET || "ecopet-dev-secret"
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountStatus: true,
        avatar: true,
        bio: true,
        username: true,
        phone: true,
        mustChangePassword: true,
        firstLoginRequired: true,
        isBootstrapUser: true,
        isMasterAdmin: true,
        isOrgAdmin: true,
        isVerified: true,
        isPremium: true,
        badges: true,
        preferences: true,
        pets: { select: { id: true, name: true, photo: true, species: true } },
        gamification: true,
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            district: true,
            city: true,
            state: true,
            zipCode: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.patch("/me/preferences", async (req: AuthRequest, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const jwt = await import("jsonwebtoken");
    const payload = jwt.default.verify(
      header.slice(7),
      process.env.JWT_SECRET || "ecopet-dev-secret"
    ) as { userId: string };

    const { a11y, locale } = req.body as { a11y?: Record<string, unknown>; locale?: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const current = (user.preferences as Record<string, unknown>) ?? {};
    const updated = {
      ...current,
      ...(a11y ? { a11y } : {}),
      ...(locale ? { locale } : {}),
    };

    await prisma.user.update({
      where: { id: payload.userId },
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
