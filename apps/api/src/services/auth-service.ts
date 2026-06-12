import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@ecopet/database";
import { createAuditLog } from "./audit-service.js";
import {
  handleBootstrapLoginAttempt,
  completeBootstrapLogin,
  isBootstrapIdentifier,
  getSystemBootstrap,
} from "./bootstrap-service.js";
import {
  createVerificationCode,
  verifyCode,
  sendPasswordChangeCodeEmail,
  sendInternalUserInviteEmail,
  sendPasswordResetEmail,
} from "./email-service.js";
import { AppError, USER_MESSAGES, accountUnavailableMessage } from "../lib/app-errors.js";
import {
  FORGOT_PASSWORD_MESSAGE,
  RESET_TOKEN_EXPIRY_MS,
  RESET_RATE_LIMITS,
  hashResetToken,
  generateResetToken,
  validateResetPasswordFields,
  resolveAppUrl,
} from "../lib/password-reset-utils.js";
import { resolveEmailProvider } from "./email-providers.js";

const JWT_SECRET = process.env.JWT_SECRET || "ecopet-dev-secret";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;
const BOOTSTRAP_PASSWORD = "AASSSVVV@1972";

export function validatePasswordStrength(password: string) {
  const errors: string[] = [];
  if (password.length < 12) errors.push("Mínimo 12 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Letra maiúscula");
  if (!/[a-z]/.test(password)) errors.push("Letra minúscula");
  if (!/[0-9]/.test(password)) errors.push("Número");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Caractere especial");
  if (password === BOOTSTRAP_PASSWORD) errors.push("Senha temporária de bootstrap não permitida");
  return { valid: errors.length === 0, errors };
}

export function requiresEmailCodeForPasswordChange(user: {
  isMasterAdmin?: boolean;
  isOrgAdmin?: boolean;
  role?: string;
  firstLoginRequired?: boolean;
}) {
  if (user.firstLoginRequired) return false;
  if (user.isMasterAdmin || user.isOrgAdmin) return true;
  return user.role === "GESTOR" || user.role === "ADMIN";
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function loginUser(params: {
  identifier: string;
  password: string;
  ip?: string;
  userAgent?: string;
}) {
  const identifier = params.identifier.toLowerCase().trim();

  await handleBootstrapLoginAttempt(identifier, params.ip, params.userAgent);

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  if (!user) {
    await prisma.loginLog.create({
      data: { email: identifier, success: false, ip: params.ip, userAgent: params.userAgent, reason: "user_not_found" },
    });
    await prisma.securityEvent.create({
      data: {
        eventType: "login_user_not_found",
        severity: "warning",
        metadata: { identifier },
        ip: params.ip,
      },
    });
    await createAuditLog({
      action: "CREATE",
      module: "auth",
      resource: "login_failed",
      metadata: { reason: "user_not_found", identifier },
      ip: params.ip,
      userAgent: params.userAgent,
    });
    throw new AppError(USER_MESSAGES.USER_NOT_FOUND, 401, "USER_NOT_FOUND");
  }

  if (user.isBootstrapUser && user.accountStatus === "SUSPENDED") {
    await handleBootstrapLoginAttempt(identifier, params.ip, params.userAgent);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "login_blocked",
        severity: "warning",
        metadata: { reason: "account_locked" },
        ip: params.ip,
      },
    });
    throw new AppError(
      accountUnavailableMessage("account_locked"),
      423,
      "ACCOUNT_LOCKED"
    );
  }

  const inactiveStatuses = ["SUSPENDED", "REJECTED", "PENDING"] as const;
  if (inactiveStatuses.includes(user.accountStatus as (typeof inactiveStatuses)[number])) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "login_blocked",
        severity: "warning",
        metadata: { accountStatus: user.accountStatus, reason: user.accountStatusReason },
        ip: params.ip,
      },
    });
    throw new AppError(
      accountUnavailableMessage(user.accountStatusReason, user.accountStatus),
      403,
      "ACCOUNT_UNAVAILABLE"
    );
  }

  if (!user.isVerified && ["ADMIN", "GESTOR"].includes(user.role)) {
    throw new AppError(
      accountUnavailableMessage("email_not_verified"),
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  const valid = await bcrypt.compare(params.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        accountStatusReason: attempts >= MAX_ATTEMPTS ? "account_locked" : user.accountStatusReason,
      },
    });
    await prisma.loginLog.create({
      data: { userId: user.id, success: false, ip: params.ip, userAgent: params.userAgent, reason: "invalid_password" },
    });
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "login_invalid_password",
        severity: "warning",
        ip: params.ip,
      },
    });
    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "auth",
      resource: "login_failed",
      metadata: { reason: "invalid_password" },
      ip: params.ip,
      userAgent: params.userAgent,
    });
    throw new AppError(USER_MESSAGES.USER_OR_PASSWORD_INCORRECT, 401, "USER_OR_PASSWORD_INCORRECT");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      ip: params.ip,
      userAgent: params.userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.loginLog.create({
    data: { userId: user.id, email: user.email, username: user.username, success: true, ip: params.ip, userAgent: params.userAgent },
  });

  const config = await getSystemBootstrap();
  const isBootstrapSession =
    user.isBootstrapUser && !config.masterAdminCreated && isBootstrapIdentifier(identifier);

  if (isBootstrapSession) {
    await completeBootstrapLogin(user.id, params.ip, params.userAgent);
    return {
      token,
      bootstrapMode: true,
      redirectTo: "/gestor/ativacao",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
        isBootstrapUser: true,
        mustChangePassword: false,
      },
    };
  }

  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    module: "auth",
    resource: "session",
    ip: params.ip,
    userAgent: params.userAgent,
  });

  let redirectTo = "/dashboard";
  if (user.role === "GESTOR" || user.role === "ADMIN") {
    redirectTo = user.firstLoginRequired || user.mustChangePassword ? "/gestor/alterar-senha" : "/gestor";
  }

  return {
    token,
    redirectTo,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      isMasterAdmin: user.isMasterAdmin,
      mustChangePassword: user.mustChangePassword,
      firstLoginRequired: user.firstLoginRequired,
    },
  };
}

export async function requestPasswordChangeCode(userId: string, currentPassword: string, ip?: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Senha atual incorreta"), { status: 400 });

  if (!requiresEmailCodeForPasswordChange(user)) {
    throw Object.assign(new Error("Confirmação por e-mail não necessária para este perfil"), { status: 400 });
  }

  const record = await createVerificationCode(userId, "PASSWORD_CHANGE");
  await sendPasswordChangeCodeEmail(user.email, user.name, record.code);

  await createAuditLog({
    userId,
    action: "CREATE",
    module: "auth",
    resource: "verification_code",
    ip,
    observation: "Código enviado para alteração de senha",
  });

  return {
    sent: true,
    devCode: process.env.NODE_ENV === "development" ? record.code : undefined,
  };
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
  emailCode?: string;
  ip?: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });

  if (params.confirmPassword && params.newPassword !== params.confirmPassword) {
    throw Object.assign(new Error("As senhas não conferem"), { status: 400 });
  }

  const valid = await bcrypt.compare(params.currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Senha atual incorreta"), { status: 400 });

  const needsEmailCode = requiresEmailCodeForPasswordChange(user);
  if (needsEmailCode) {
    if (!params.emailCode) {
      throw Object.assign(new Error("Código de confirmação por e-mail obrigatório"), { status: 400 });
    }
    const ok = await verifyCode(params.userId, "PASSWORD_CHANGE", params.emailCode);
    if (!ok) throw Object.assign(new Error("Código inválido ou expirado"), { status: 400 });
  }

  const strength = validatePasswordStrength(params.newPassword);
  if (!strength.valid) {
    throw Object.assign(new Error(`Senha fraca: ${strength.errors.join(", ")}`), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(params.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      firstLoginRequired: false,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "PASSWORD_CHANGED", severity: "info", ip: params.ip },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    module: "auth",
    resource: "password",
    ip: params.ip,
    observation: needsEmailCode ? "Senha alterada com confirmação por e-mail" : "Senha alterada",
  });

  return { success: true };
}

export async function updateProfile(params: {
  userId: string;
  currentPassword: string;
  data: {
    name?: string;
    phone?: string;
    bio?: string;
    avatar?: string;
    address?: {
      street: string;
      number?: string;
      complement?: string;
      district?: string;
      city: string;
      state: string;
      zipCode?: string;
      reference?: string;
      latitude?: number | null;
      longitude?: number | null;
    };
  };
  ip?: string;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  const valid = await bcrypt.compare(params.currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Senha atual incorreta"), { status: 400 });

  const before = { name: user.name, phone: user.phone, bio: user.bio, avatar: user.avatar };
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(params.data.name ? { name: params.data.name } : {}),
      ...(params.data.phone !== undefined ? { phone: params.data.phone } : {}),
      ...(params.data.bio !== undefined ? { bio: params.data.bio } : {}),
      ...(params.data.avatar !== undefined ? { avatar: params.data.avatar } : {}),
      ...(params.data.address
        ? {
            address: {
              upsert: {
                create: {
                  street: params.data.address.street,
                  number: params.data.address.number || "S/N",
                  complement: params.data.address.complement,
                  district: params.data.address.district || "Centro",
                  city: params.data.address.city,
                  state: params.data.address.state.toUpperCase(),
                  zipCode: params.data.address.zipCode || "00000-000",
                  latitude: params.data.address.latitude ?? undefined,
                  longitude: params.data.address.longitude ?? undefined,
                },
                update: {
                  street: params.data.address.street,
                  number: params.data.address.number || "S/N",
                  complement: params.data.address.complement,
                  district: params.data.address.district || "Centro",
                  city: params.data.address.city,
                  state: params.data.address.state.toUpperCase(),
                  zipCode: params.data.address.zipCode || "00000-000",
                  latitude: params.data.address.latitude ?? undefined,
                  longitude: params.data.address.longitude ?? undefined,
                },
              },
            },
          }
        : {}),
    },
    include: { address: true },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    module: "auth",
    resource: "profile",
    ip: params.ip,
    entityBefore: before,
    entityAfter: { name: updated.name, phone: updated.phone, bio: updated.bio, avatar: updated.avatar },
    observation: "Dados cadastrais alterados",
  });

  return {
    success: true,
    user: {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      bio: updated.bio,
      avatar: updated.avatar,
      address: updated.address,
    },
  };
}

export async function requestPasswordReset(
  email: string,
  ctx: { ip?: string; userAgent?: string } = {}
) {
  const normalizedEmail = email.toLowerCase().trim();
  const genericResponse = { message: FORGOT_PASSWORD_MESSAGE, sent: true as const };

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  if (ctx.ip) {
    const ipAttempts = await prisma.passwordResetToken.count({
      where: { ipAddress: ctx.ip, createdAt: { gt: hourAgo } },
    });
    if (ipAttempts >= RESET_RATE_LIMITS.maxPerIpPerHour) {
      await prisma.securityEvent.create({
        data: {
          eventType: "PASSWORD_RESET_RATE_LIMIT_IP",
          severity: "warning",
          ip: ctx.ip,
          metadata: { email: normalizedEmail },
        },
      });
      return genericResponse;
    }
  }

  const { blockBootstrapPasswordReset } = await import("./bootstrap-service.js");
  const blocked = await blockBootstrapPasswordReset(normalizedEmail);
  if (blocked.blocked) {
    return genericResponse;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || user.isBootstrapUser) {
    return genericResponse;
  }

  const emailAttempts = await prisma.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gt: hourAgo } },
  });
  if (emailAttempts >= RESET_RATE_LIMITS.maxPerEmailPerHour) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_RESET_RATE_LIMIT_EMAIL",
        severity: "warning",
        ip: ctx.ip,
        metadata: { email: normalizedEmail },
      },
    });
    return genericResponse;
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    },
  });

  const resetLink = `${resolveAppUrl()}/redefinir-senha?token=${token}`;

  try {
    await sendPasswordResetEmail({ email: user.email, resetLink });
  } catch (err) {
    await prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_RESET_EMAIL_FAILED",
        severity: "error",
        ip: ctx.ip,
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      },
    });
    return genericResponse;
  }

  await prisma.securityEvent.create({
    data: { userId: user.id, eventType: "PASSWORD_RESET_REQUEST", severity: "info", ip: ctx.ip },
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    module: "auth",
    resource: "password_reset_request",
    ip: ctx.ip,
    metadata: { email: user.email },
  });

  const devToken =
    process.env.NODE_ENV !== "production" && resolveEmailProvider() === "console" ? token : undefined;

  return { ...genericResponse, resetToken: devToken };
}

export async function validateResetToken(token: string) {
  if (!token) return { valid: false as const, reason: "invalid" as const };
  const tokenHash = hashResetToken(token);
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset) return { valid: false as const, reason: "invalid" as const };
  if (reset.usedAt) return { valid: false as const, reason: "used" as const };
  if (reset.expiresAt < new Date()) return { valid: false as const, reason: "expired" as const };
  return { valid: true as const };
}

export async function resetPassword(
  token: string,
  novaSenha: string,
  confirmarNovaSenha: string,
  ctx: { ip?: string } = {}
) {
  if (ctx.ip) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const ipAttempts = await prisma.securityEvent.count({
      where: {
        eventType: "PASSWORD_RESET_ATTEMPT",
        ip: ctx.ip,
        createdAt: { gt: hourAgo },
      },
    });
    if (ipAttempts >= RESET_RATE_LIMITS.maxResetAttemptsPerIpPerHour) {
      throw new AppError("Muitas tentativas. Aguarde e tente novamente mais tarde.", 429, "RATE_LIMIT");
    }
  }

  await prisma.securityEvent.create({
    data: {
      eventType: "PASSWORD_RESET_ATTEMPT",
      severity: "info",
      ip: ctx.ip,
    },
  });

  const passwordCheck = validateResetPasswordFields(novaSenha, confirmarNovaSenha);
  if (!passwordCheck.valid) {
    throw new AppError(passwordCheck.error, 400, passwordCheck.code);
  }

  const tokenHash = hashResetToken(token);
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset) {
    throw new AppError("Link inválido. Solicite uma nova recuperação de senha.", 400, "INVALID_TOKEN");
  }
  if (reset.usedAt) {
    throw new AppError("Este link já foi utilizado. Solicite uma nova recuperação de senha.", 400, "TOKEN_USED");
  }
  if (reset.expiresAt < new Date()) {
    throw new AppError("Link expirado. Solicite uma nova recuperação de senha.", 400, "TOKEN_EXPIRED");
  }

  const passwordHash = await bcrypt.hash(novaSenha, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        firstLoginRequired: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: reset.userId, usedAt: null, id: { not: reset.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  await createAuditLog({
    userId: reset.userId,
    action: "UPDATE",
    module: "auth",
    resource: "password",
    ip: ctx.ip,
    metadata: { method: "password_reset_link" },
  });

  await prisma.securityEvent.create({
    data: { userId: reset.userId, eventType: "PASSWORD_RESET_SUCCESS", severity: "info", ip: ctx.ip },
  });

  return { success: true, message: "Senha redefinida com sucesso." };
}

export async function listActiveSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId, active: true, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function revokeSession(sessionId: string, userId: string) {
  return prisma.userSession.updateMany({
    where: { id: sessionId, userId },
    data: { active: false },
  });
}

export async function createGestorInvite(params: {
  email: string;
  name: string;
  roleCode: string;
  departmentId?: string;
  invitedById: string;
}) {
  const email = params.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error("E-mail já cadastrado"), { status: 409 });
  }

  const tempPassword = crypto.randomBytes(4).toString("hex") + "A1!";
  const token = crypto.randomBytes(32).toString("hex");
  const username = email.split("@")[0].replace(/[^a-z0-9]/g, "") + crypto.randomInt(100, 999);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const role = await prisma.rbacRole.findUnique({ where: { code: params.roleCode } });

  const { invite, user } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: params.name,
        role: "GESTOR",
        accountStatus: "ACTIVE",
        isVerified: true,
        firstLoginRequired: true,
        mustChangePassword: true,
        departmentId: params.departmentId,
        gestorProfile: {
          create: {
            jobTitle: role?.name ?? params.roleCode,
            corporateEmail: email,
            hierarchyLevel: role?.hierarchyLevel ?? 10,
            employeeCode: `INV-${crypto.randomInt(1000, 9999)}`,
          },
        },
        gamification: { create: {} },
      },
    });

    if (role) {
      await tx.userRbacAssignment.create({
        data: { userId: createdUser.id, roleId: role.id, grantedBy: params.invitedById },
      });
    }

    const createdInvite = await tx.gestorInvite.create({
      data: {
        email,
        name: params.name,
        roleCode: params.roleCode,
        departmentId: params.departmentId,
        tempPassword,
        token,
        status: "SENT",
        invitedById: params.invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { invite: createdInvite, user: createdUser };
  });

  await sendInternalUserInviteEmail({ email, name: params.name, username, tempPassword });

  await createAuditLog({
    userId: params.invitedById,
    action: "CREATE",
    module: "gestor",
    resource: "internal_user",
    resourceId: user.id,
    metadata: { email, roleCode: params.roleCode, inviteId: invite.id },
    observation: "Usuário interno criado com senha temporária",
  });

  return {
    invite,
    user: { id: user.id, email: user.email, username: user.username, name: user.name },
    tempPassword: process.env.NODE_ENV === "development" ? tempPassword : undefined,
    username,
  };
}

export function checkPasswordStrengthRealtime(password: string) {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notTemp: password !== BOOTSTRAP_PASSWORD,
    score: [password.length >= 12, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length,
  };
}

export async function getPasswordChangePolicy(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    requiresEmailCode: requiresEmailCodeForPasswordChange(user),
    firstLoginRequired: user.firstLoginRequired,
    role: user.role,
    isMasterAdmin: user.isMasterAdmin,
    isOrgAdmin: user.isOrgAdmin,
  };
}
