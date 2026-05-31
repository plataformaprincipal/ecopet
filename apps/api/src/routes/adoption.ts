import { Router } from "express";
import { prisma } from "@ecopet/database";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const listings = await prisma.adoptionListing.findMany({
      where: { status: "AVAILABLE" },
      include: { ong: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(listings);
  } catch (e) {
    next(e);
  }
});

export default router;
