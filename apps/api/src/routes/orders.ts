import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createOrder,
  listUserOrders,
  getOrderById,
  updateOrderStatus,
  confirmPickup,
  requestOrderRefund,
} from "../services/order-service.js";

const router = Router();

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    quoteId: z.string().optional(),
    itemType: z.string().optional(),
    name: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    partnerId: z.string().optional(),
  })).min(1),
  shippingAddress: z.record(z.unknown()),
  alternateAddress: z.record(z.unknown()).optional(),
  deliveryMethod: z.enum([
    "PICKUP_LOCAL", "DELIVERY_LOCAL", "DELIVERY_REGIONAL", "DELIVERY_NATIONAL",
    "DELIVERY_OWN", "DELIVERY_PARTNER_LOGISTICS", "DELIVERY_SCHEDULED", "PICKUP_SCHEDULED",
  ]),
  paymentMethod: z.enum(["CARD", "PIX", "CASH", "TRANSFER", "WALLET", "BOLETO"]),
  scheduledAt: z.string().optional(),
  deliveryNotes: z.string().optional(),
  thirdPartyPickup: z.object({ name: z.string(), document: z.string() }).optional(),
  serviceMode: z.enum(["IN_PERSON", "HOME", "ONLINE"]).optional(),
  onlineLink: z.string().optional(),
  partnerId: z.string().optional(),
  discount: z.number().optional(),
  couponCode: z.string().optional(),
});

router.post("/checkout", async (req: AuthRequest, res, next) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const order = await createOrder({ ...data, userId: req.userId! });
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const orders = await listUserOrders(req.userId!);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const order = await getOrderById(req.params.id, req.userId!);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/pickup/confirm", async (req: AuthRequest, res, next) => {
  try {
    const { qrCode } = z.object({ qrCode: z.string().optional() }).parse(req.body);
    const order = await confirmPickup(req.params.id, req.userId!, qrCode);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/refund", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const refund = await requestOrderRefund(req.params.id, req.userId!, reason);
    res.json(refund);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const partnerRoles = ["PETSHOP", "SELLER", "SERVICE_PROVIDER", "VETERINARIAN", "CLINIC", "PARTNER", "ADMIN", "GESTOR"];
    if (!partnerRoles.includes(req.userRole ?? "")) {
      return res.status(403).json({ error: "Apenas parceiros ou gestores podem atualizar status" });
    }
    const { status, note } = z.object({
      status: z.enum(["PENDING", "PAID", "PROCESSING", "READY_PICKUP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED", "REFUNDED"]),
      note: z.string().optional(),
    }).parse(req.body);
    const order = await updateOrderStatus(req.params.id, status, note, req.userId!);
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;
