import { Router } from "express";
import { z } from "zod";
import { paramString } from "../lib/request-utils.js";
import { publicRegisterSchema } from "../schemas/register-schemas.js";
import { registerUser } from "../services/register-service.js";
import { sendSuccess, sendFailure } from "../lib/express-api-response.js";
import {
  loginUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  validateResetToken,
  listActiveSessions,
  revokeSession,
  checkPasswordStrengthRealtime,
  requestPasswordChangeCode,
  updateProfile,
  getPasswordChangePolicy,
  logoutCurrentSession,
  refreshAccessToken,
} from "../services/auth-service.js";
import { createUserSessionTokens } from "../lib/session-tokens.js";
import { setAuthCookies, clearAuthCookies, readRefreshToken } from "../lib/auth-cookies.js";
import { getCurrentUserById } from "../services/current-user-service.js";
import {
  createMasterAdmin,
  getBootstrapStatus,
} from "../services/bootstrap-service.js";
import { sendMasterAdminConfirmationEmail } from "../services/email-service.js";
import { validatePasswordStrength } from "../services/auth-service.js";
import {
  forgotPasswordIpLimiter,
  resetPasswordIpLimiter,
} from "../middleware/password-reset-rate-limit.js";
import { FORGOT_PASSWORD_MESSAGE } from "../lib/password-reset-utils.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { AppError, USER_MESSAGES } from "../lib/app-errors.js";
import { logStructured } from "../lib/logger.js";
import { Prisma } from "@prisma/client";

const router = Router();

function sendAppError(res: import("express").Response, e: AppError) {
  return sendFailure(res, e.code ?? "INTERNAL", e.userMessage, e.status);
}

function sendLegacyError(res: import("express").Response, err: Error & { status?: number; message?: string }) {
  if (err.status) return sendFailure(res, "VALIDATION", err.message, err.status);
  throw err;
}

function logRegisterRequestBody(body: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  logStructured("auth", "register_payload", {
    name: data.name,
    email: data.email,
    cpf: data.cpf,
    cnpj: data.cnpj,
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    phone: data.phone,
    birthDate: data.birthDate,
    role: data.role,
    primaryInterests: data.primaryInterests,
    acceptTerms: data.acceptTerms,
    acceptLgpd: data.acceptLgpd,
  });
}

function logRegisterFailure(err: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const e = err as Error & { code?: string; meta?: unknown };
  console.error("[register:error]", {
    name: e?.name,
    message: e?.message,
    code: e?.code,
    meta: e instanceof Prisma.PrismaClientKnownRequestError ? e.meta : e?.meta,
    stack: e?.stack,
  });
}

const loginSchema = z.object({
  email: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
  password: z.string(),
}).refine((d) => d.email || d.username || d.identifier, { message: "Informe e-mail ou usuário" });

router.get("/bootstrap/status", async (_req, res, next) => {
  try {
    return sendSuccess(res, await getBootstrapStatus());
  } catch (e) {
    next(e);
  }
});

router.post("/register", async (req, res, next) => {
  logRegisterRequestBody(req.body);
  try {
    const parsed = publicRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return sendFailure(res, "VALIDATION", first?.message || USER_MESSAGES.VALIDATION, 400);
    }
    const { user, redirectTo } = await registerUser(parsed.data, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const { accessToken, refreshToken } = await createUserSessionTokens({
      userId: user.id,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setAuthCookies(res, accessToken, refreshToken);
    logStructured("auth", "register_success", { userId: user.id, email: user.email, role: user.role });
    return sendSuccess(res, {
      user,
      token: accessToken,
      redirectTo,
      pendingApproval: user.accountStatus === "PENDING",
      message: user.accountStatus === "PENDING"
        ? "Cadastro recebido! Sua conta será analisada pela equipe EcoPet."
        : "Conta criada com sucesso!",
    }, 201);
  } catch (e) {
    if (e instanceof AppError) {
      return sendFailure(res, e.code ?? "INTERNAL", e.userMessage, e.status);
    }
    logRegisterFailure(e);
    next(e);
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await getCurrentUserById(req.userId!);
    if (!user) return sendFailure(res, "NOT_FOUND", "Usuário não encontrado", 404);
    return sendSuccess(res, { user });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      return sendFailure(res, "SESSION", USER_MESSAGES.SESSION, 401);
    }
    const rotated = await refreshAccessToken(refreshToken);
    if (!rotated) {
      clearAuthCookies(res);
      return sendFailure(res, "SESSION", USER_MESSAGES.SESSION, 401);
    }
    setAuthCookies(res, rotated.accessToken, refreshToken);
    return sendSuccess(res, { token: rotated.accessToken, userId: rotated.userId, role: rotated.role });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const refreshToken = readRefreshToken(req) ?? undefined;
    await logoutCurrentSession("", req.userId!, refreshToken);
    clearAuthCookies(res);
    logStructured("auth", "logout", { userId: req.userId });
    return sendSuccess(res);
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const identifier = data.identifier ?? data.email ?? data.username ?? "";
    const result = await loginUser({
      identifier,
      password: data.password,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    logStructured("auth", "login_success", {
      userId: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
    });
    return sendSuccess(res, result);
  } catch (e) {
    if (e instanceof AppError) return sendAppError(res, e);
    next(e);
  }
});

router.post("/bootstrap/create-master", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      username: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/i),
      password: z.string(),
      confirmPassword: z.string(),
      phone: z.string().min(10),
      jobTitle: z.string().min(2),
      securityAccepted: z.literal(true),
    }).parse(req.body);

    if (body.password !== body.confirmPassword) {
      return sendFailure(res, "VALIDATION", "As senhas não conferem", 400);
    }

    const strength = validatePasswordStrength(body.password);
    if (!strength.valid) {
      return sendFailure(res, "VALIDATION", `Senha fraca: ${strength.errors.join(", ")}`, 400);
    }

    const master = await createMasterAdmin({
      ...body,
      bootstrapUserId: req.userId!,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await sendMasterAdminConfirmationEmail({
      email: master.email,
      name: master.name,
      ip: req.ip,
      device: req.headers["user-agent"],
    });

    const { accessToken, refreshToken } = await createUserSessionTokens({
      userId: master.id,
      role: master.role,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, {
      token: accessToken,
      redirectTo: "/gestor",
      user: { id: master.id, email: master.email, username: master.username, name: master.name, role: master.role, isMasterAdmin: true },
    }, 201);
  } catch (e) {
    try {
      sendLegacyError(res, e as Error & { status?: number; message?: string });
    } catch {
      next(e);
    }
  }
});

router.get("/password/policy", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    return sendSuccess(res, await getPasswordChangePolicy(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/password/request-code", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword } = z.object({ currentPassword: z.string() }).parse(req.body);
    const result = await requestPasswordChangeCode(req.userId!, currentPassword, req.ip);
    return sendSuccess(res, result);
  } catch (e) {
    try {
      sendLegacyError(res, e as Error & { status?: number; message?: string });
    } catch {
      next(e);
    }
  }
});

router.post("/change-password", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword, emailCode } = z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
      confirmPassword: z.string().optional(),
      emailCode: z.string().optional(),
    }).parse(req.body);
    const result = await changePassword({
      userId: req.userId!,
      currentPassword,
      newPassword,
      confirmPassword,
      emailCode,
      ip: req.ip,
    });
    return sendSuccess(res, result);
  } catch (e) {
    try {
      sendLegacyError(res, e as Error & { status?: number; message?: string });
    } catch {
      next(e);
    }
  }
});

router.patch("/profile", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, name, phone, bio, avatar, address } = z.object({
      currentPassword: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
      address: z.object({
        street: z.string().min(3),
        number: z.string().optional(),
        complement: z.string().optional(),
        district: z.string().optional(),
        city: z.string().min(2),
        state: z.string().length(2),
        zipCode: z.string().optional(),
        reference: z.string().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      }).optional(),
    }).parse(req.body);
    const result = await updateProfile({
      userId: req.userId!,
      currentPassword,
      data: { name, phone, bio, avatar, address },
      ip: req.ip,
    });
    return sendSuccess(res, result);
  } catch (e) {
    try {
      sendLegacyError(res, e as Error & { status?: number; message?: string });
    } catch {
      next(e);
    }
  }
});

router.post("/forgot-password", forgotPasswordIpLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await requestPasswordReset(email, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    return sendSuccess(res, result);
  } catch (e) {
    if (e instanceof AppError) {
      return sendSuccess(res, { message: FORGOT_PASSWORD_MESSAGE });
    }
    next(e);
  }
});

router.get("/reset-password/validate", resetPasswordIpLimiter, async (req, res, next) => {
  try {
    const token = String(req.query.token ?? "");
    const result = await validateResetToken(token);
    return sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post("/reset-password", resetPasswordIpLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        token: z.string().min(1),
        novaSenha: z.string().optional(),
        confirmarNovaSenha: z.string().optional(),
        newPassword: z.string().optional(),
        confirmPassword: z.string().optional(),
        code: z.string().optional(),
      })
      .parse(req.body);

    const novaSenha = body.novaSenha ?? body.newPassword ?? "";
    const confirmarNovaSenha = body.confirmarNovaSenha ?? body.confirmPassword ?? "";

    const result = await resetPassword(body.token, novaSenha, confirmarNovaSenha, { ip: req.ip });
    return sendSuccess(res, result);
  } catch (e) {
    if (e instanceof AppError) return sendAppError(res, e);
    next(e);
  }
});

router.post("/check-password-strength", (req, res) => {
  const { password } = z.object({ password: z.string() }).parse(req.body);
  return sendSuccess(res, checkPasswordStrengthRealtime(password));
});

router.get("/sessions", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    return sendSuccess(res, await listActiveSessions(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.delete("/sessions/:id", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await revokeSession(paramString(req.params.id), req.userId!);
    return sendSuccess(res);
  } catch (e) {
    next(e);
  }
});

export default router;
