import { renderWelcomeEmail, type EmailLocale } from "@/lib/email/templates";

/** @deprecated Use renderRegistrationCompletedEmail / renderWelcomeEmail from `@/lib/email/templates` */
export function welcomeEmail(userName: string, appUrl: string, role = "CLIENT", locale: EmailLocale = "pt-BR") {
  return renderWelcomeEmail({ locale, appUrl, name: userName, role });
}
