import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { isGestorRole, userHasAnyPermission } from "../services/rbac-service.js";

export function requireGestor() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!isGestorRole(req.userRole)) {
      return res.status(403).json({ error: "Acesso restrito ao Gestor ECOPET" });
    }
    next();
  };
}

export function requirePermission(...permissionCodes: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: "Não autenticado" });
    if (req.userRole === "ADMIN") return next();
    if (!isGestorRole(req.userRole)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const allowed = await userHasAnyPermission(req.userId, permissionCodes);
    if (!allowed) {
      return res.status(403).json({ error: "Permissão insuficiente", required: permissionCodes });
    }
    next();
  };
}
