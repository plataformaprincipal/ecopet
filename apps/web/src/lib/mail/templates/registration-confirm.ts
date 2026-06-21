import { renderRegistrationCompletedEmail } from "@/lib/email/templates";

/** @deprecated Use renderRegistrationCompletedEmail from `@/lib/email/templates` */
export function registrationConfirmEmail(userName: string, appUrl: string) {
  return renderRegistrationCompletedEmail({
    locale: "pt-BR",
    appUrl,
    name: userName,
    role: "CLIENT",
  });
}
