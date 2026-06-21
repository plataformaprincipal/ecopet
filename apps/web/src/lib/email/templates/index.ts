export { EMAIL_BRAND, EMAIL_LOGO_PATH, getEmailLogoUrl } from "@/lib/email/templates/constants";
export { escapeHtml } from "@/lib/email/templates/utils";
export {
  resolveEmailLocale,
  getUserEmailLocale,
  emailHtmlLang,
  DEFAULT_EMAIL_LOCALE,
  type EmailLocale,
  localeFromAcceptLanguage,
} from "@/lib/email/templates/locale";
export { getEmailCopy, roleLabel } from "@/lib/email/templates/i18n/copy";
export { emailLayout, emailFooter } from "@/lib/email/templates/components/layout";
export {
  emailHeader,
  emailButton,
  emailOtpBlock,
  emailTitle,
  emailParagraph,
  emailMuted,
  emailInfoRow,
} from "@/lib/email/templates/components/blocks";
export {
  renderPasswordRecoveryEmail,
  renderOtpCodeEmail,
  renderWelcomeEmail,
  renderRegistrationCompletedEmail,
  renderPasswordChangedEmail,
  renderOrderPlacedEmail,
  renderAppointmentScheduledEmail,
  renderNotificationEmail,
  renderEmailTemplate,
} from "@/lib/email/templates/render";
export type { EmailTemplateResult, EmailTemplateName } from "@/lib/email/templates/types";
