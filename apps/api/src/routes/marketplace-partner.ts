import { Router } from "express";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { sendSuccess, sendFailure } from "../lib/express-api-response.js";
import { serializeProduct } from "../lib/serialize.js";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "../services/audit-service.js";
import { listPartnerOrders, updateOrderStatus } from "../services/order-service.js";

const PARTNER_ROLES = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER", "ADMIN", "GESTOR"];

const router = Router();

function requirePartner(req: AuthRequest, res: import("express").Response, next: import("express").NextFunction) {
  if (!PARTNER_ROLES.includes(req.userRole ?? "")) {
    return sendFailure(res, "FORBIDDEN", "Acesso restrito a parceiros", 403);
  }
  next();
}

router.use(requirePartner);

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  sku: z.string().optional(),
});

router.get("/products", async (req: AuthRequest, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.userId! },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
    return sendSuccess(res, { products: products.map(serializeProduct), total: products.length });
  } catch (e) {
    next(e);
  }
});

router.post("/products", async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        sellerId: req.userId!,
        name: data.name,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        categoryId: data.categoryId,
        stock: data.stock ?? 0,
        images: asOptionalInputJson(data.images),
        sku: data.sku,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
      },
      include: { category: true },
    });
    await createAuditLog({ userId: req.userId, action: "CREATE", module: "marketplace", resource: "product", resourceId: product.id });
    return sendSuccess(res, { product: serializeProduct(product) }, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/products/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const existing = await prisma.product.findFirst({ where: { id: paramString(req.params.id), sellerId: req.userId! } });
    if (!existing) return sendFailure(res, "NOT_FOUND", "Produto não encontrado", 404);
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...data,
        images: data.images ? asOptionalInputJson(data.images) : undefined,
        approvalStatus: "APPROVED",
      },
      include: { category: true },
    });
    return sendSuccess(res, { product: serializeProduct(product) });
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: paramString(req.params.id), sellerId: req.userId! } });
    if (!existing) return sendFailure(res, "NOT_FOUND", "Produto não encontrado", 404);
    await prisma.product.delete({ where: { id: existing.id } });
    return sendSuccess(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.enum([
    "BATH_GROOMING", "VET_CONSULTATION", "VACCINATION", "DOG_WALKER", "PET_SITTER",
    "TRAINING", "BOARDING", "PET_TRANSPORT",
  ]),
  durationMin: z.number().int().positive().optional(),
  image: z.string().optional(),
});

router.get("/services", async (req: AuthRequest, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { providerId: req.userId! },
      orderBy: { updatedAt: "desc" },
    });
    return sendSuccess(res, { services, total: services.length });
  } catch (e) {
    next(e);
  }
});

router.post("/services", async (req: AuthRequest, res, next) => {
  try {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({
      data: {
        providerId: req.userId!,
        type: "READY_SERVICE",
        ...data,
        status: "ACTIVE",
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });
    return sendSuccess(res, { service }, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/services/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const existing = await prisma.service.findFirst({ where: { id: paramString(req.params.id), providerId: req.userId! } });
    if (!existing) return sendFailure(res, "NOT_FOUND", "Serviço não encontrado", 404);
    const service = await prisma.service.update({
      where: { id: existing.id },
      data: { ...data, approvalStatus: "APPROVED" },
    });
    return sendSuccess(res, { service });
  } catch (e) {
    next(e);
  }
});

router.delete("/services/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.service.findFirst({ where: { id: paramString(req.params.id), providerId: req.userId! } });
    if (!existing) return sendFailure(res, "NOT_FOUND", "Serviço não encontrado", 404);
    await prisma.service.delete({ where: { id: existing.id } });
    return sendSuccess(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

router.get("/orders", async (req: AuthRequest, res, next) => {
  try {
    const orders = await listPartnerOrders(req.userId!);
    return sendSuccess(res, { orders, total: orders.length });
  } catch (e) {
    next(e);
  }
});

router.patch("/orders/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const { status, note } = z.object({
      status: z.enum(["PENDING", "PAID", "PROCESSING", "READY_PICKUP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED", "REFUNDED"]),
      note: z.string().optional(),
    }).parse(req.body);
    const order = await prisma.order.findFirst({ where: { id: paramString(req.params.id), partnerId: req.userId! } });
    if (!order) return sendFailure(res, "NOT_FOUND", "Pedido não encontrado", 404);
    const updated = await updateOrderStatus(order.id, status, note, req.userId!);
    return sendSuccess(res, { order: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
