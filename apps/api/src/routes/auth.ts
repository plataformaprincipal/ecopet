import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@ecopet/database";
import { z } from "zod";
import { paramString } from "../lib/request-utils.js";
import { publicRegisterSchema } from "../schemas/register-schemas.js";
import { registerUser } from "../services/register-service.js";
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
} from "../services/auth-service.js";
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

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
  password: z.string(),
}).refine((d) => d.email || d.username || d.identifier, { message: "Informe e-mail ou usuário" });

router.get("/bootstrap/status", async (_req, res, next) => {
  try {
    res.json(await getBootstrapStatus());
  } catch (e) {
    next(e);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = publicRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return res.status(400).json({
        error: first?.message || USER_MESSAGES.VALIDATION,
        code: "VALIDATION",
        details: parsed.error.flatten(),
      });
    }
    const { user, redirectTo } = await registerUser(parsed.data, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || "ecopet-dev-secret", { expiresIn: "7d" });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json({
      user,
      token,
      redirectTo,
      pendingApproval: user.accountStatus === "PENDING",
      message: user.accountStatus === "PENDING"
        ? "Cadastro recebido! Sua conta será analisada pela equipe EcoPet."
        : "Conta criada com sucesso!",
    });
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.status).json({ error: e.userMessage, code: e.code });
    }
    next(e);
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await getCurrentUserById(req.userId!);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.post("/logout", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(400).json({ error: "Token não fornecido" });
    const result = await logoutCurrentSession(token, req.userId!);
    res.json(result);
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
    res.json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.status).json({ error: e.userMessage, code: e.code });
    }
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
      return res.status(400).json({ error: "As senhas não conferem" });
    }

    const strength = validatePasswordStrength(body.password);
    if (!strength.valid) {
      return res.status(400).json({ error: `Senha fraca: ${strength.errors.join(", ")}` });
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

    const token = jwt.sign(
      { userId: master.id, role: master.role },
      process.env.JWT_SECRET || "ecopet-dev-secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      redirectTo: "/gestor",
      user: { id: master.id, email: master.email, username: master.username, name: master.name, role: master.role, isMasterAdmin: true },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
  }
});

router.get("/password/policy", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    res.json(await getPasswordChangePolicy(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.post("/password/request-code", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword } = z.object({ currentPassword: z.string() }).parse(req.body);
    const result = await requestPasswordChangeCode(req.userId!, currentPassword, req.ip);
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
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
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
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
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
  }
});

router.post("/forgot-password", forgotPasswordIpLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await requestPasswordReset(email, {
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.status).json({ message: FORGOT_PASSWORD_MESSAGE });
    }
    next(e);
  }
});

router.get("/reset-password/validate", resetPasswordIpLimiter, async (req, res, next) => {
  try {
    const token = String(req.query.token ?? "");
    const result = await validateResetToken(token);
    res.json(result);
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
    res.json(result);
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.status).json({ error: e.userMessage, code: e.code });
    }
    next(e);
  }
});

router.post("/check-password-strength", (req, res) => {
  const { password } = z.object({ password: z.string() }).parse(req.body);
  res.json(checkPasswordStrengthRealtime(password));
});

router.get("/sessions", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    res.json(await listActiveSessions(req.userId!));
  } catch (e) {
    next(e);
  }
});

router.delete("/sessions/:id", authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await revokeSession(paramString(req.params.id), req.userId!);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
