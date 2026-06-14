import { Router } from "express";
import { prisma } from "@ecopet/database";
import { serializeProduct } from "../lib/serialize.js";
import { sendSuccess, sendFailure } from "../lib/express-api-response.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
        stock: { gt: 0 },
        ...(q ? { OR: [{ name: { contains: String(q), mode: "insensitive" } }, { description: { contains: String(q), mode: "insensitive" } }] } : {}),
        ...(category ? { catalogCategory: String(category) as never } : {}),
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
        seller: { select: { id: true, name: true, isVerified: true, partnerProfile: { select: { businessName: true, city: true, state: true } } } },
        category: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
    return sendSuccess(res, { products: products.map(serializeProduct), total: products.length });
  } catch (e) {
    next(e);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.productCategory.findMany();
    return sendSuccess(res, { categories });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, deletedAt: null, status: "ACTIVE", approvalStatus: "APPROVED" },
      include: {
        seller: { select: { id: true, name: true, isVerified: true, partnerProfile: { select: { businessName: true, city: true, state: true } } } },
        category: true,
        reviews: {
          where: { moderationStatus: "VISIBLE" },
          include: { user: { select: { name: true, avatar: true } } },
          take: 10,
        },
      },
    });
    if (!product) return sendFailure(res, "NOT_FOUND", "Produto não encontrado", 404);
    return sendSuccess(res, { product: serializeProduct(product) });
  } catch (e) {
    next(e);
  }
});

export default router;
