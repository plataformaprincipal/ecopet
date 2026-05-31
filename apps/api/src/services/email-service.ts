import crypto from "crypto";
import { prisma } from "@ecopet/database";
import { createAuditLog } from "./audit-service.js";

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const log = {
    to: params.to,
    subject: params.subject,
    sentAt: new Date().toISOString(),
    ...params.metadata,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[ECOPET Email]", JSON.stringify(log, null, 2));
    console.log("[ECOPET Email Body]", params.body);
  }

  await prisma.securityEvent.create({
    data: {
      eventType: "EMAIL_SENT",
      severity: "info",
      metadata: { to: params.to, subject: params.subject, ...params.metadata },
    },
  });

  return { sent: true, devPreview: process.env.NODE_ENV === "development" ? params.body : undefined };
}

export async function createVerificationCode(userId: string, purpose: string) {
  const code = generateCode();
  await prisma.verificationCode.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });
  const record = await prisma.verificationCode.create({
    data: {
      userId,
      code,
      purpose,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  return record;
}

export async function verifyCode(userId: string, purpose: string, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, purpose, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;
  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } });
  await createAuditLog({
    userId,
    action: "VIEW",
    module: "auth",
    resource: "verification_code",
    resourceId: record.id,
    observation: `Código validado: ${purpose}`,
  });
  return true;
}

export async function sendMasterAdminConfirmationEmail(params: {
  email: string;
  name: string;
  device?: string;
  ip?: string;
}) {
  const now = new Date();
  const body = `Olá ${params.name},

Sua conta de Super Administrador Master ECOPET foi criada com sucesso.

Data: ${now.toLocaleDateString("pt-BR")}
Hora: ${now.toLocaleTimeString("pt-BR")}
${params.device ? `Dispositivo: ${params.device}` : ""}
${params.ip ? `IP: ${params.ip}` : ""}

IMPORTANTE — Segurança:
• Nunca compartilhe suas credenciais
• Utilize senha forte e exclusiva
• O usuário temporário de ativação (gestorveras) foi permanentemente desativado

Equipe ECOPET`;

  return sendEmail({
    to: params.email,
    subject: "Confirmação — Super Administrador Master ECOPET",
    body,
    metadata: { type: "master_admin_confirmation" },
  });
}

export async function sendPasswordChangeCodeEmail(email: string, name: string, code: string) {
  const body = `Olá ${name},

Seu código de confirmação para alteração de senha ECOPET é:

${code}

Este código expira em 15 minutos. Se você não solicitou esta alteração, ignore este e-mail.

Equipe ECOPET`;

  return sendEmail({
    to: email,
    subject: "Código de confirmação — Alteração de senha ECOPET",
    body,
    metadata: { type: "password_change_code" },
  });
}

export async function sendInternalUserInviteEmail(params: {
  email: string;
  name: string;
  username: string;
  tempPassword: string;
}) {
  const body = `Olá ${params.name},

Você foi convidado(a) para a equipe Gestor ECOPET.

Usuário: ${params.username}
Senha temporária: ${params.tempPassword}

Acesse o sistema e altere sua senha no primeiro login.

Equipe ECOPET`;

  return sendEmail({
    to: params.email,
    subject: "Convite — Equipe Gestor ECOPET",
    body,
    metadata: { type: "internal_user_invite", username: params.username },
  });
}
