import { Router } from "express";
import { prisma } from "@ecopet/database";
import { AuthRequest, authMiddleware } from "../middleware/auth.js";
import { deprecatedSocialApi } from "../middleware/deprecated-social-api.js";
import { paramString } from "../lib/request-utils.js";
import { serializePost } from "../lib/serialize.js";

const router = Router();
router.use(deprecatedSocialApi);

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
    const postId = paramString(req.params.id);
    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: req.userId! } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }
    await prisma.like.create({ data: { postId, userId: req.userId! } });
    res.json({ liked: true });
  } catch (e) {
    next(e);
  }
});

export default router;
