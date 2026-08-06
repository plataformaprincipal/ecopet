import type { Response, NextFunction } from "express";
import { prisma } from "@ecopet/database";
import type { AuthRequest } from "./auth.js";
import { sendFailure } from "../lib/express-api-response.js";

const PARTNER_PENDING_MESSAGE =
  "Sua conta de parceiro está em análise. Você poderá operar após a aprovação administrativa.";

/**
 * Express gate: PARTNER + ACTIVE + verification APPROVED + approvedAt.
 * ADMIN/GESTOR bypass for support tooling.
 */
export async function requireApprovedPartnerExpress(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const role = req.userRole ?? "";
  if (role === "ADMIN" || role === "GESTOR") {
    return next();
  }

  if (role !== "PARTNER") {
    return sendFailure(res, "FORBIDDEN", "Acesso restrito a parceiros aprovados", 403);
  }

  if (!req.userId) {
    return sendFailure(res, "UNAUTHORIZED", "Não autenticado", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      accountStatus: true,
      partnerProfile: { select: { verificationStatus: true, approvedAt: true } },
    },
  });

  if (
    !user ||
    user.accountStatus !== "ACTIVE" ||
    user.partnerProfile?.verificationStatus !== "APPROVED" ||
    !user.partnerProfile.approvedAt
  ) {
    return sendFailure(res, "FORBIDDEN", PARTNER_PENDING_MESSAGE, 403);
  }

  return next();
}
