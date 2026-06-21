import { EmailStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { sendRecoveryOtpEmail, getRecoveryOtpSubject } from "@/lib/email/send-recovery-otp";
import { getResendApiKey } from "@/lib/email/resend";
import type { EmailLocale } from "@/lib/email/templates";

async function logPasswordRecoveryEmail(
  recipient: string,
  subject: string,
  status: EmailStatus,
  error?: string,
  emailId?: string
) {
  try {
    await prisma.emailLog.create({
      data: {
        recipient,
        subject,
        event: "PASSWORD_RESET",
        status,
        provider: "resend",
        error: error ?? (emailId ? `id:${emailId}` : undefined),
        sentAt: status === EmailStatus.SENT ? new Date() : undefined,
      },
    });
  } catch {
    /* não interromper fluxo */
  }
}

function formatResendError(error: unknown): string {
  if (!error) return "RESEND_SEND_FAILED";
  if (typeof error === "object" && error !== null) {
    const e = error as { name?: string; message?: string };
    return [e.name, e.message].filter(Boolean).join(": ") || "RESEND_SEND_FAILED";
  }
  return String(error);
}

/** Recuperação de senha — exclusivamente Resend (sem SMTP). */
export async function sendPasswordRecoveryOtpEmail(
  to: string,
  code: string,
  options?: { name?: string; locale?: EmailLocale }
): Promise<{ sent: boolean; errorCode?: string; errorDetail?: string; emailId?: string }> {
  const locale = options?.locale ?? "pt-BR";
  const subject = getRecoveryOtpSubject(locale);

  if (!getResendApiKey()) {
    const msg = "RESEND_API_KEY ausente";
    console.error("[forgot-password] Resend error:", JSON.stringify({ message: msg }, null, 2));
    await writeIntegrationLog({
      integrationName: "resend",
      provider: "Resend",
      action: "PASSWORD_RESET",
      status: "NOT_CONFIGURED",
      errorCode: "RESEND_NOT_CONFIGURED",
      message: msg,
    });
    await logPasswordRecoveryEmail(to, subject, EmailStatus.FAILED, msg);
    return { sent: false, errorCode: "RESEND_NOT_CONFIGURED", errorDetail: msg };
  }

  const result = await sendRecoveryOtpEmail({
    to,
    code,
    name: options?.name,
    locale,
    logPrefix: "[forgot-password]",
  });

  if (result.sent) {
    await logPasswordRecoveryEmail(to, subject, EmailStatus.SENT, undefined, result.id);
    await writeIntegrationLog({
      integrationName: "resend",
      provider: "Resend",
      action: "PASSWORD_RESET",
      status: "OK",
    });
    return { sent: true, emailId: result.id };
  }

  const errorDetail = formatResendError(result.error);
  await logPasswordRecoveryEmail(to, subject, EmailStatus.FAILED, errorDetail);
  await writeIntegrationLog({
    integrationName: "resend",
    provider: "Resend",
    action: "PASSWORD_RESET",
    status: "FAILED",
    errorCode: "RESEND_SEND_FAILED",
    message: errorDetail,
  });
  return { sent: false, errorCode: "RESEND_SEND_FAILED", errorDetail };
}
