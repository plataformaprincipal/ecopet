import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CouponError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400
  ) {
    super(message);
  }
}

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  fundedBy?: string | null;
  marginFloorBps?: number | null;
};

export function computeCouponDiscountBrl(coupon: CouponRow, grossBrl: number): number {
  if (!(grossBrl > 0)) return 0;
  const type = coupon.discountType.toUpperCase();
  let amount = 0;
  if (type === "PERCENT" || type === "PERCENTAGE") {
    amount = (grossBrl * coupon.discountValue) / 100;
  } else {
    amount = coupon.discountValue;
  }
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(grossBrl, Math.round(amount * 100) / 100);
}

function assertCouponWindow(coupon: CouponRow, now = new Date()) {
  if (!coupon.isActive) throw new CouponError("Cupom inativo.", "COUPON_INACTIVE", 400);
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new CouponError("Cupom ainda não está válido.", "COUPON_NOT_STARTED", 400);
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw new CouponError("Cupom expirado.", "COUPON_EXPIRED", 400);
  }
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new CouponError("Cupom esgotado.", "COUPON_EXHAUSTED", 400);
  }
}

export async function previewCouponForUser(params: {
  userId: string;
  code: string;
  grossBrl: number;
}) {
  const quoted = await quoteCouponInTx(prisma, params);
  return {
    code: quoted.coupon.code,
    discountAmount: quoted.discountAmount,
    discountType: quoted.coupon.discountType,
    discountValue: quoted.coupon.discountValue,
    description: quoted.coupon.description,
  };
}

export async function quoteCouponInTx(
  tx: Prisma.TransactionClient | typeof prisma,
  params: { userId: string; code: string; grossBrl: number }
) {
  const code = params.code.trim().toUpperCase();
  const coupon = await tx.coupon.findUnique({ where: { code } });
  if (!coupon) throw new CouponError("Cupom inválido.", "COUPON_NOT_FOUND", 404);
  assertCouponWindow(coupon);
  if (coupon.minOrderCents != null && params.grossBrl * 100 < coupon.minOrderCents) {
    throw new CouponError("Pedido abaixo do mínimo do cupom.", "COUPON_MIN_ORDER", 400);
  }
  const reserved = await tx.couponRedemption.findFirst({
    where: { couponId: coupon.id, userId: params.userId, orderId: null },
  });
  if (!reserved) {
    const used = await tx.couponRedemption.findFirst({
      where: { couponId: coupon.id, userId: params.userId, orderId: { not: null } },
    });
    if (used && coupon.maxRedemptions === 1) {
      throw new CouponError("Este cupom já foi utilizado.", "COUPON_USED", 400);
    }
  }
  const discountAmount = computeCouponDiscountBrl(coupon, params.grossBrl);
  if (discountAmount <= 0) {
    throw new CouponError("Este cupom não é válido para os itens do seu carrinho.", "COUPON_ZERO", 400);
  }
  return { coupon, discountAmount };
}

/** Aplica cupom na mesma transação do checkout. Nunca confia no desconto do cliente. */
export async function consumeCouponInCheckout(params: {
  tx: Prisma.TransactionClient;
  userId: string;
  code: string;
  grossBrl: number;
  orderId: string;
}) {
  const code = params.code.trim().toUpperCase();
  const coupon = await params.tx.coupon.findUnique({ where: { code } });
  if (!coupon) throw new CouponError("Cupom inválido.", "COUPON_NOT_FOUND", 404);
  assertCouponWindow(coupon);
  if (coupon.minOrderCents != null && params.grossBrl * 100 < coupon.minOrderCents) {
    throw new CouponError("Pedido abaixo do mínimo do cupom.", "COUPON_MIN_ORDER", 400);
  }
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new CouponError("Cupom esgotado.", "COUPON_EXHAUSTED", 400);
  }

  const discountAmount = computeCouponDiscountBrl(coupon, params.grossBrl);
  if (discountAmount <= 0) {
    throw new CouponError("Este cupom não é válido para os itens do seu carrinho.", "COUPON_ZERO", 400);
  }

  const reserved = await params.tx.couponRedemption.findFirst({
    where: { couponId: coupon.id, userId: params.userId, orderId: null },
  });
  if (reserved) {
    await params.tx.couponRedemption.update({
      where: { id: reserved.id },
      data: { orderId: params.orderId },
    });
  } else {
    const used = await params.tx.couponRedemption.findFirst({
      where: { couponId: coupon.id, userId: params.userId, orderId: { not: null } },
    });
    if (used && coupon.maxRedemptions === 1) {
      throw new CouponError("Este cupom já foi utilizado.", "COUPON_USED", 400);
    }
    await params.tx.couponRedemption.create({
      data: { couponId: coupon.id, userId: params.userId, orderId: params.orderId },
    });
  }

  await params.tx.coupon.update({
    where: { id: coupon.id },
    data: { redemptionCount: { increment: 1 } },
  });

  return { coupon, discountAmount };
}
