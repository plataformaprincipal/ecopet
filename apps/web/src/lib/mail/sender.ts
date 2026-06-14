import fs from "fs";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { EmailStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MailConfigurationError,
  isSmtpFullyConfigured,
  logSmtpError,
  missingSmtpEnvVars,
  resolveMailConfig,
  getAppUrl,
} from "./config";
import { passwordResetEmail } from "./templates/password-reset";
import { welcomeEmail } from "./templates/welcome";

export type SendMailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/pass(word)?[:=]\S+/gi, "pass=***");
}

export async function createMailTransporter(): Promise<Transporter> {
  const cfg = resolveMailConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  } as unknown as nodemailer.TransportOptions);
}

async function logEmailAttempt(data: {
  id?: string;
  recipient: string;
  subject: string;
  status: EmailStatus;
  provider?: string;
  error?: string;
  sentAt?: Date;
}) {
  try {
    if (data.id) {
      await prisma.emailLog.update({
        where: { id: data.id },
        data: {
          status: data.status,
          provider: data.provider,
          error: data.error,
          sentAt: data.sentAt,
        },
      });
      return data.id;
    }
    const row = await prisma.emailLog.create({
      data: {
        recipient: data.recipient,
        subject: data.subject,
        status: data.status,
        provider: data.provider,
        error: data.error,
        sentAt: data.sentAt,
      },
    });
    return row.id;
  } catch (e) {
    console.error("[mail:log]", safeErrorMessage(e));
    return undefined;
  }
}

export async function sendMail(payload: SendMailPayload): Promise<void> {
  const cfg = resolveMailConfig();
  const transporter = await createMailTransporter();

  const logId = await logEmailAttempt({
    recipient: payload.to,
    subject: payload.subject,
    status: EmailStatus.PENDING,
    provider: cfg.provider,
  });

  try {
    const info = await transporter.sendMail({
      from: cfg.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (logId) {
      await logEmailAttempt({
        id: logId,
        recipient: payload.to,
        subject: payload.subject,
        status: EmailStatus.SENT,
        provider: cfg.provider,
        sentAt: new Date(),
      });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[mail] Enviado para ${payload.to} via ${cfg.provider} (${cfg.host}:${cfg.port}) response=${info.response ?? "ok"}`
      );
    }
  } catch (error) {
    logSmtpError("mail:sendMail", error);
    if (logId) {
      await logEmailAttempt({
        id: logId,
        recipient: payload.to,
        subject: payload.subject,
        status: EmailStatus.FAILED,
        provider: cfg.provider,
        error: safeErrorMessage(error),
      });
    }
    throw error;
  }
}

export async function verifySmtpConnection(): Promise<void> {
  const transporter = await createMailTransporter();
  await transporter.verify();
}

function logDevFallback(to: string, subject: string, link: string, token?: string) {
  console.warn("\n[mail:dev] AVISO: SMTP não configurado — e-mail real NÃO será enviado.");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`[mail:dev] ${subject}`);
  console.log(`  Para: ${to}`);
  console.log(`  Link: ${link}`);
  console.log("══════════════════════════════════════════════════════════\n");

  const testFile = process.env.PASSWORD_RESET_TEST_FILE?.trim();
  if (testFile && token && process.env.NODE_ENV !== "production") {
    fs.writeFileSync(testFile, token, "utf8");
  }
}

export function logMailError(context: string, error: unknown) {
  logSmtpError(context, error);
  if (error instanceof MailConfigurationError && error.missing.length > 0) {
    console.error(`[${context}] Variáveis ausentes: ${error.missing.join(", ")}`);
  }
}

async function deliverEmail(
  payload: SendMailPayload,
  devFallback?: { link: string; token?: string }
): Promise<void> {
  if (isSmtpFullyConfigured()) {
    await sendMail(payload);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    const err = new MailConfigurationError("SMTP incompleto em produção.", missingSmtpEnvVars());
    logMailError("mail", err);
    throw err;
  }

  if (devFallback) {
    logDevFallback(payload.to, payload.subject, devFallback.link, devFallback.token);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string
): Promise<void> {
  const tpl = passwordResetEmail(resetUrl, userName);
  const token = new URL(resetUrl).searchParams.get("token") ?? undefined;
  await deliverEmail({ to, ...tpl }, { link: resetUrl, token });
}

export async function sendWelcomeEmail(to: string, userName: string): Promise<void> {
  const tpl = welcomeEmail(userName, getAppUrl());

  if (isSmtpFullyConfigured()) {
    await sendMail({ to, ...tpl });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new MailConfigurationError("SMTP incompleto em produção.", missingSmtpEnvVars());
  }

  console.warn(`[mail:dev] Boas-vindas não enviado (SMTP ausente) — ${to}`);
}

export async function sendTestEmail(to: string): Promise<void> {
  await sendMail({
    to,
    subject: "EcoPet — teste SMTP",
    text: "Este é um e-mail de teste do EcoPet. Se você recebeu, o SMTP está configurado corretamente.",
    html: "<p>Este é um e-mail de teste do <strong>EcoPet</strong>.</p>",
  });
}

/** @deprecated use logDevFallback internamente */
export function logDevResetLink(resetUrl: string) {
  logDevFallback("", "Redefinição de senha — EcoPet", resetUrl);
}
