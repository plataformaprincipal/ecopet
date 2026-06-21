import { renderPasswordRecoveryEmail } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/mail/config";

/** @deprecated Use renderPasswordRecoveryEmail from `@/lib/email/templates` */
export function passwordResetOtpEmail(code: string, name?: string) {
  return renderPasswordRecoveryEmail({
    locale: "pt-BR",
    appUrl: getAppUrl(),
    name: name ?? "Usuário",
    code,
  });
}
