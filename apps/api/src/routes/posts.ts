import { Router } from "express";
import { prisma } from "@ecopet/database";
import { AuthRequest, authMiddleware } from "../middleware/auth.js";
import { serializePost } from "../lib/serialize.js";

const router = Router();

router.get("/feed", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const posts = await prisma.post.findMany({
      where: { isPrivate: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatar: true, isVerified: true } },
        pet: { select: { id: true, name: true, photo: true } },
        _count: { select: { likes: true, comments: true } },
        hashtags: { include: { hashtag: true } },
      },
    });
    res.json(posts.map(serializePost));
  } catch (e) {
    next(e);
  }
});

router.post("/:id/like", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.userId! } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }
    await prisma.like.create({ data: { postId: req.params.id, userId: req.userId! } });
    res.json({ liked: true });
  } catch (e) {
    next(e);
  }
});

export default router;
