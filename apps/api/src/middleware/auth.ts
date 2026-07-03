import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { readAccessToken } from "../lib/auth-cookies.js";
import { apiEnv } from "../lib/env.js";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = readAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido", code: "SESSION" });
  }

  try {
    const payload = jwt.verify(token, apiEnv.jwtSecret) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado", code: "SESSION" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };
}
