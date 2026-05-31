import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { isAdvisoryEligible } from "../services/advisory-service.js";

export function requireAdvisoryAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (!isAdvisoryEligible(req.userRole)) {
      return res.status(403).json({ error: "Assessoria Inteligente disponível apenas para Parceiros e ONGs" });
    }
    next();
  };
}
