import { Router } from "express";
import { z } from "zod";
import { prisma } from "@ecopet/database";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { serializeProduct } from "../lib/serialize.js";
import { asOptionalInputJson } from "../lib/prisma-json.js";
import { createAuditLog } from "../services/audit-service.js";
import { listPartnerOrders, updateOrderStatus } from "../services/order-service.js";

const PARTNER_ROLES = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER", "ADMIN", "GESTOR"];

const router = Router();

function requirePartner(req: AuthRequest, res: import("express").Response, next: import("express").NextFunction) {
  if (!PARTNER_ROLES.includes(req.userRole ?? "")) {
    return res.status(403).json({ error: "Acesso restrito a parceiros" });
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
    res.json(products.map(serializeProduct));
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
        approvalStatus: "PENDING",
      },
      include: { category: true },
    });
    await createAuditLog({ userId: req.userId, action: "CREATE", module: "marketplace", resource: "product", resourceId: product.id });
    res.status(201).json(serializeProduct(product));
  } catch (e) {
    next(e);
  }
});

router.patch("/products/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const existing = await prisma.product.findFirst({ where: { id: paramString(req.params.id), sellerId: req.userId! } });
    if (!existing) return res.status(404).json({ error: "Produto não encontrado" });
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...data,
        images: data.images ? asOptionalInputJson(data.images) : undefined,
        approvalStatus: "PENDING",
      },
      include: { category: true },
    });
    res.json(serializeProduct(product));
  } catch (e) {
    next(e);
  }
});

router.delete("/products/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: paramString(req.params.id), sellerId: req.userId! } });
    if (!existing) return res.status(404).json({ error: "Produto não encontrado" });
    await prisma.product.delete({ where: { id: existing.id } });
    res.json({ ok: true });
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
    res.json(services);
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
        approvalStatus: "PENDING",
      },
    });
    res.status(201).json(service);
  } catch (e) {
    next(e);
  }
});

router.patch("/services/:id", async (req: AuthRequest, res, next) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    const existing = await prisma.service.findFirst({ where: { id: paramString(req.params.id), providerId: req.userId! } });
    if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
    const service = await prisma.service.update({
      where: { id: existing.id },
      data: { ...data, approvalStatus: "PENDING" },
    });
    res.json(service);
  } catch (e) {
    next(e);
  }
});

router.delete("/services/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.service.findFirst({ where: { id: paramString(req.params.id), providerId: req.userId! } });
    if (!existing) return res.status(404).json({ error: "Serviço não encontrado" });
    await prisma.service.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/orders", async (req: AuthRequest, res, next) => {
  try {
    res.json(await listPartnerOrders(req.userId!));
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
    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    res.json(await updateOrderStatus(order.id, status, note, req.userId!));
  } catch (e) {
    next(e);
  }
});

export default router;
