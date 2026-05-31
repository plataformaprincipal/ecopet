import { Router } from "express";
import { prisma } from "@ecopet/database";
import { serializeProduct } from "../lib/serialize.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const products = await prisma.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: String(q) } }, { description: { contains: String(q) } }] } : {}),
        ...(category ? { category: { slug: String(category) } } : {}),
        ...(minPrice || maxPrice
          ? {
              price: {
                 ...(minPrice ? { gte: parseFloat(String(minPrice)) } : {}),
                ...(maxPrice ? { lte: parseFloat(String(maxPrice)) } : {}),
              },
            }
          : {}),
      },
      include: {
        seller: { select: { id: true, name: true, isVerified: true } },
        category: true,
      },
      orderBy: [{ isSponsored: "desc" }, { createdAt: "desc" }],
    });
    res.json(products.map(serializeProduct));
  } catch (e) {
    next(e);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.productCategory.findMany();
    res.json(categories);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, name: true, isVerified: true } },
        category: true,
        reviews: { include: { user: { select: { name: true, avatar: true } } }, take: 10 },
      },
    });
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });
    res.json(serializeProduct(product));
  } catch (e) {
    next(e);
  }
});

export default router;
