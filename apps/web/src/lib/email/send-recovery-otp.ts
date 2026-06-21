import { sendEmail, maskEmailForLog } from "@/lib/email/email-service";
import {
  renderPasswordRecoveryEmail,
  type EmailLocale,
} from "@/lib/email/templates";
import { getEmailCopy } from "@/lib/email/templates/i18n/copy";
import { getAppUrl } from "@/lib/mail/config";

export { maskEmailForLog };

export function getRecoveryOtpSubject(locale: EmailLocale): string {
  return getEmailCopy(locale).passwordRecovery.subject;
}

/** @deprecated Use getRecoveryOtpSubject(locale) */
export const RECOVERY_OTP_SUBJECT = getRecoveryOtpSubject("pt-BR");

export type SendRecoveryOtpResult = {
  sent: boolean;
  id?: string;
  data?: unknown;
  error?: unknown;
  errorCode?: string;
};

/** Recuperação de senha — template premium via serviço centralizado Resend. */
export async function sendRecoveryOtpEmail(params: {
  to: string;
  code: string;
  name?: string;
  locale?: EmailLocale;
  logPrefix?: string;
}): Promise<SendRecoveryOtpResult> {
  const locale = params.locale ?? "pt-BR";
  const appUrl = getAppUrl();
  const template = renderPasswordRecoveryEmail({
    locale,
    appUrl,
    name: params.name ?? params.to.split("@")[0] ?? "Usuário",
    code: params.code,
  });

  const result = await sendEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    logPrefix: params.logPrefix ?? "[forgot-password]",
  });

  return {
    sent: result.sent,
    id: result.id,
    data: result.data,
    error: result.error,
    errorCode: result.errorCode,
  };
}
