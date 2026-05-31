import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@ecopet/database";
import { createAuditLog } from "./audit-service.js";

const BOOTSTRAP_USERNAME = "gestorveras";
const BOOTSTRAP_UNAVAILABLE_MSG =
  "Acesso indisponível. O usuário temporário de ativação já foi utilizado e não está mais disponível.";

export async function getSystemBootstrap() {
  let config = await prisma.systemBootstrap.findUnique({ where: { id: "singleton" } });
  if (!config) {
    config = await prisma.systemBootstrap.create({ data: { id: "singleton" } });
  }
  return config;
}

export function isBootstrapIdentifier(identifier: string) {
  return identifier.toLowerCase().trim() === BOOTSTRAP_USERNAME;
}

export async function handleBootstrapLoginAttempt(identifier: string, ip?: string, userAgent?: string) {
  if (!isBootstrapIdentifier(identifier)) return null;

  const config = await getSystemBootstrap();
  if (config.bootstrapUsed || config.bootstrapDisabled) {
    await prisma.loginLog.create({
      data: { username: BOOTSTRAP_USERNAME, success: false, ip, userAgent, reason: "bootstrap_disabled" },
    });
    await prisma.securityEvent.create({
      data: { eventType: "BOOTSTRAP_LOGIN_BLOCKED", severity: "high", ip, metadata: { identifier } },
    });
    await createAuditLog({
      action: "LOGIN",
      module: "bootstrap",
      resource: "gestorveras",
      ip,
      userAgent,
      observation: "Tentativa de login com usuário bootstrap já invalidado",
      riskLevel: "high",
    });
    throw Object.assign(new Error(BOOTSTRAP_UNAVAILABLE_MSG), { status: 403 });
  }
  return config;
}

export async function completeBootstrapLogin(userId: string, ip?: string, userAgent?: string) {
  await createAuditLog({
    userId,
    action: "LOGIN",
    module: "bootstrap",
    resource: "gestorveras",
    ip,
    userAgent,
    observation: "Login bootstrap — redirecionamento para criação do Master Admin",
  });
  return { bootstrapMode: true, redirectTo: "/gestor/ativacao" };
}

export interface CreateMasterAdminInput {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  jobTitle: string;
  securityAccepted: boolean;
  bootstrapUserId: string;
  ip?: string;
  userAgent?: string;
}

export async function createMasterAdmin(input: CreateMasterAdminInput) {
  const config = await getSystemBootstrap();
  if (config.masterAdminCreated) {
    throw Object.assign(new Error("Super Administrador Master já foi criado"), { status: 409 });
  }

  const bootstrapUser = await prisma.user.findUnique({ where: { id: input.bootstrapUserId } });
  if (!bootstrapUser?.isBootstrapUser || bootstrapUser.accountStatus !== "ACTIVE") {
    throw Object.assign(new Error("Sessão de bootstrap inválida"), { status: 403 });
  }

  if (!input.securityAccepted) {
    throw Object.assign(new Error("Aceite os termos de segurança"), { status: 400 });
  }

  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail && !existingEmail.isBootstrapUser) {
    throw Object.assign(new Error("E-mail já cadastrado"), { status: 409 });
  }
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername && !existingUsername.isBootstrapUser) {
    throw Object.assign(new Error("Nome de usuário já em uso"), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const masterUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: "GESTOR",
        accountStatus: "ACTIVE",
        isVerified: true,
        isMasterAdmin: true,
        isOrgAdmin: true,
        mustChangePassword: false,
        firstLoginRequired: false,
        passwordChangedAt: new Date(),
        gestorProfile: {
          create: {
            jobTitle: input.jobTitle,
            corporateEmail: email,
            hierarchyLevel: 200,
            employeeCode: "MASTER-ADMIN",
          },
        },
        gamification: { create: {} },
      },
    });

    const superRole = await tx.rbacRole.findUnique({ where: { code: "gestor_super" } });
    if (superRole) {
      await tx.userRbacAssignment.create({
        data: { userId: user.id, roleId: superRole.id, grantedBy: user.id },
      });
    }

    await tx.user.update({
      where: { id: input.bootstrapUserId },
      data: {
        accountStatus: "SUSPENDED",
        isBootstrapUser: true,
        mustChangePassword: false,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
      },
    });

    await tx.systemBootstrap.update({
      where: { id: "singleton" },
      data: {
        bootstrapUsed: true,
        bootstrapUsedAt: new Date(),
        bootstrapDisabled: true,
        bootstrapUserId: input.bootstrapUserId,
        masterAdminCreated: true,
        masterAdminUserId: user.id,
        initializedAt: new Date(),
      },
    });

    return user;
  });

  await createAuditLog({
    userId: masterUser.id,
    action: "CREATE",
    module: "bootstrap",
    resource: "master_admin",
    resourceId: masterUser.id,
    ip: input.ip,
    userAgent: input.userAgent,
    observation: "Super Administrador Master criado — bootstrap concluído",
    riskLevel: "high",
  });

  await createAuditLog({
    userId: input.bootstrapUserId,
    action: "UPDATE",
    module: "bootstrap",
    resource: "gestorveras",
    resourceId: input.bootstrapUserId,
    observation: "Usuário temporário gestorveras invalidado permanentemente",
    riskLevel: "high",
  });

  await prisma.securityEvent.create({
    data: {
      userId: masterUser.id,
      eventType: "MASTER_ADMIN_CREATED",
      severity: "critical",
      ip: input.ip,
      metadata: { email, username },
    },
  });

  return masterUser;
}

export async function getBootstrapStatus() {
  const config = await getSystemBootstrap();
  return {
    initialized: config.masterAdminCreated,
    bootstrapAvailable: !config.bootstrapUsed && !config.bootstrapDisabled,
    masterAdminUserId: config.masterAdminUserId,
  };
}

export async function blockBootstrapPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user?.isBootstrapUser || user?.username === BOOTSTRAP_USERNAME) {
    const config = await getSystemBootstrap();
    if (config.bootstrapUsed || config.bootstrapDisabled) {
      return { blocked: true, message: BOOTSTRAP_UNAVAILABLE_MSG };
    }
  }
  return { blocked: false };
}
