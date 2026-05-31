import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { registerSchema } from "../schemas/register-schemas.js";
import { registerUser } from "../services/register-service.js";
import {
  loginUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  listActiveSessions,
  revokeSession,
  checkPasswordStrengthRealtime,
  requestPasswordChangeCode,
  updateProfile,
  getPasswordChangePolicy,
} from "../services/auth-service.js";
import {
  createMasterAdmin,
  getBootstrapStatus,
} from "../services/bootstrap-service.js";
import { sendMasterAdminConfirmationEmail } from "../services/email-service.js";
import { validatePasswordStrength } from "../services/auth-service.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

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
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return res.status(400).json({ error: first?.message || "Dados inválidos", details: parsed.error.flatten() });
    }
    const { user, redirectTo } = await registerUser(parsed.data);
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || "ecopet-dev-secret", { expiresIn: "7d" });
    res.status(201).json({ user, token, redirectTo });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ error: `Já existe cadastro com este ${(e.meta?.target as string[])?.[0] ?? "campo"}` });
    }
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
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
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
    const { currentPassword, name, phone, bio, avatar } = z.object({
      currentPassword: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      avatar: z.string().optional(),
    }).parse(req.body);
    const result = await updateProfile({
      userId: req.userId!,
      currentPassword,
      data: { name, phone, bio, avatar },
      ip: req.ip,
    });
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(e);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword, code } = z.object({
      token: z.string(),
      newPassword: z.string(),
      code: z.string(),
    }).parse(req.body);
    const result = await resetPassword(token, newPassword, code);
    res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status) return res.status(err.status).json({ error: err.message });
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
    await revokeSession(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
