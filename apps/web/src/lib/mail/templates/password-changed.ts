import { renderPasswordChangedEmail } from "@/lib/email/templates";

/** @deprecated Use renderPasswordChangedEmail from `@/lib/email/templates` */
export function passwordChangedEmail(userName: string, loginUrl: string) {
  return renderPasswordChangedEmail({
    locale: "pt-BR",
    appUrl: loginUrl,
    name: userName,
  });
}
