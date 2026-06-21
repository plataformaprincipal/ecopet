import { renderOtpCodeEmail } from "@/lib/email/templates";

/** @deprecated Use renderOtpCodeEmail from `@/lib/email/templates` */
export function emailVerificationEmail(userName: string, verifyLink: string) {
  const appUrl = verifyLink.split("/verificar")[0] || verifyLink;
  void userName;
  return renderOtpCodeEmail({ locale: "pt-BR", appUrl, code: "000000" });
}
