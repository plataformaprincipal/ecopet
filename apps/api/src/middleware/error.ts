import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError, USER_MESSAGES } from "../lib/app-errors.js";
import { createAuditLog } from "../services/audit-service.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.userMessage, code: err.code });
  }

  if (err instanceof ZodError) {
    const first = err.errors[0];
    return res.status(400).json({
      error: first?.message || USER_MESSAGES.VALIDATION,
      code: "VALIDATION",
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? "campo";
      const map: Record<string, string> = {
        email: USER_MESSAGES.EMAIL_DUPLICATE,
        cpf: USER_MESSAGES.CPF_DUPLICATE_SHORT,
        cnpj: USER_MESSAGES.CNPJ_DUPLICATE_SHORT,
        phone: USER_MESSAGES.PHONE_DUPLICATE,
      };
      return res.status(409).json({
        error: map[target] ?? USER_MESSAGES.DATABASE,
        code: `${String(target).toUpperCase()}_DUPLICATE`,
      });
    }
    console.error("[ECOPET API] Prisma", err.code, err.message);
    return res.status(503).json({ error: USER_MESSAGES.DATABASE, code: "DATABASE" });
  }

  console.error("[ECOPET API]", err.message, err.stack);
  createAuditLog({
    action: "CREATE",
    module: "system",
    resource: "unexpected_error",
    metadata: { path: req.path, message: err.message },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  }).catch(() => {});

  res.status(500).json({ error: USER_MESSAGES.UNEXPECTED, code: "UNEXPECTED" });
}
