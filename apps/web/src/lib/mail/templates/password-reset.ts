import { renderPasswordRecoveryEmail } from "@/lib/email/templates";

/** @deprecated Use renderPasswordRecoveryEmail com código OTP */
export function passwordResetEmail(link: string, userName?: string) {
  const appUrl = link.split("/redefinir-senha")[0] || link;
  return renderPasswordRecoveryEmail({
    locale: "pt-BR",
    appUrl,
    name: userName ?? "Usuário",
    code: "000000",
  });
}
