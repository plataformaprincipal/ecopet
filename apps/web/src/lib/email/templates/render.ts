import type { EmailLocale } from "@/lib/email/templates/locale";
import { getEmailCopy, roleLabel } from "@/lib/email/templates/i18n/copy";
import { emailHeader, emailButton, emailOtpBlock, emailTitle, emailParagraph, emailMuted, emailInfoRow } from "@/lib/email/templates/components/blocks";
import { emailLayout } from "@/lib/email/templates/components/layout";
import { escapeHtml } from "@/lib/email/templates/utils";
import type { EmailTemplateResult, EmailTemplateName } from "@/lib/email/templates/types";

function build(params: {
  locale: EmailLocale;
  appUrl: string;
  previewText: string;
  subject: string;
  text: string;
  body: string;
}): EmailTemplateResult {
  const html = emailLayout({
    locale: params.locale,
    previewText: params.previewText,
    appUrl: params.appUrl,
    content: `${emailHeader(params.appUrl)}${params.body}`,
  });
  return { subject: params.subject, html, text: params.text };
}

export function renderPasswordRecoveryEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  code: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).passwordRecovery;
  const resetUrl = `${params.appUrl.replace(/\/$/, "")}/recuperar-senha`;
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${copy.greeting(params.name)}`)}
    ${emailParagraph(copy.message)}
    ${emailOtpBlock(params.code, copy.otpLabel)}
    ${emailMuted(copy.validity)}
    ${emailButton(copy.button, resetUrl)}
    ${emailMuted(copy.ignore)}`;
  const text = `${copy.title}\n\n${copy.greeting(params.name)}\n${copy.message}\n\n${copy.otpLabel}: ${params.code}\n${copy.validity}\n\n${copy.button}: ${resetUrl}\n\n${copy.ignore}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview(params.name),
    subject: copy.subject,
    text,
    body,
  });
}

export function renderOtpCodeEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  code: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).otpCode;
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(copy.message)}
    ${emailOtpBlock(params.code, copy.otpLabel)}
    ${emailMuted(copy.validity)}
    ${emailMuted(copy.ignore)}`;
  const text = `${copy.title}\n\n${copy.message}\n\n${copy.otpLabel}: ${params.code}\n${copy.validity}\n\n${copy.ignore}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview,
    subject: copy.subject,
    text,
    body,
  });
}

export function renderWelcomeEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  role: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).welcome;
  const accountType = roleLabel(params.locale, params.role);
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${copy.greeting(params.name)}`)}
    ${emailParagraph(copy.message)}
    ${emailInfoRow(copy.accountType, accountType)}
    ${emailParagraph(copy.dashboardAccess)}
    ${emailButton(copy.button, params.appUrl)}`;
  const text = `${copy.title}\n\n${copy.greeting(params.name)}\n${copy.message}\n${copy.accountType}: ${accountType}\n${copy.dashboardAccess}\n\n${copy.button}: ${params.appUrl}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview(params.name),
    subject: copy.subject,
    text,
    body,
  });
}

export function renderRegistrationCompletedEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  role: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).registrationCompleted;
  const accountType = roleLabel(params.locale, params.role);
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${copy.greeting(params.name)}`)}
    ${emailParagraph(copy.message)}
    ${emailInfoRow(copy.accountType, accountType)}
    ${emailParagraph(copy.dashboardAccess)}
    ${emailButton(copy.button, params.appUrl)}`;
  const text = `${copy.title}\n\n${copy.greeting(params.name)}\n${copy.message}\n${copy.accountType}: ${accountType}\n${copy.dashboardAccess}\n\n${copy.button}: ${params.appUrl}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview(params.name),
    subject: copy.subject,
    text,
    body,
  });
}

export function renderPasswordChangedEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).passwordChanged;
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${getEmailCopy(params.locale).welcome.greeting(params.name)}`)}
    ${emailParagraph(copy.message)}
    ${emailMuted(copy.securityTip)}
    ${emailButton(copy.button, params.appUrl)}`;
  const text = `${copy.title}\n\n${copy.message}\n${copy.securityTip}\n\n${copy.button}: ${params.appUrl}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview,
    subject: copy.subject,
    text,
    body,
  });
}

export function renderOrderPlacedEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  orderNumber: number;
  orderUrl?: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).orderPlaced;
  const url = params.orderUrl ?? `${params.appUrl.replace(/\/$/, "")}/pedidos`;
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${copy.greeting(params.name)}`)}
    ${emailParagraph(copy.message(params.orderNumber))}
    ${emailButton(copy.button, url)}`;
  const text = `${copy.title}\n\n${copy.greeting(params.name)}\n${copy.message(params.orderNumber)}\n\n${copy.button}: ${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview(params.orderNumber),
    subject: copy.subject(params.orderNumber),
    text,
    body,
  });
}

export function renderAppointmentScheduledEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  serviceName: string;
  agendaUrl?: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).appointmentScheduled;
  const url = params.agendaUrl ?? `${params.appUrl.replace(/\/$/, "")}/agenda`;
  const body = `
    ${emailTitle(copy.title)}
    ${emailParagraph(`${copy.greeting(params.name)}`)}
    ${emailParagraph(copy.message(params.serviceName))}
    ${emailButton(copy.button, url)}`;
  const text = `${copy.title}\n\n${copy.greeting(params.name)}\n${copy.message(params.serviceName)}\n\n${copy.button}: ${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview,
    subject: copy.subject,
    text,
    body,
  });
}

export function renderNotificationEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  title?: string;
  message: string;
  actionUrl?: string;
}): EmailTemplateResult {
  const copy = getEmailCopy(params.locale).notification;
  const title = params.title ?? copy.defaultTitle;
  const url = params.actionUrl ?? params.appUrl;
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(escapeHtml(params.message))}
    ${emailButton(copy.button, url)}`;
  const text = `${title}\n\n${params.message}\n\n${copy.button}: ${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: copy.preview(title),
    subject: copy.subject(title),
    text,
    body,
  });
}

export function renderEmailTemplate(
  template: EmailTemplateName,
  params: Record<string, unknown>
): EmailTemplateResult {
  switch (template) {
    case "password-recovery":
      return renderPasswordRecoveryEmail(params as Parameters<typeof renderPasswordRecoveryEmail>[0]);
    case "otp-code":
      return renderOtpCodeEmail(params as Parameters<typeof renderOtpCodeEmail>[0]);
    case "welcome":
      return renderWelcomeEmail(params as Parameters<typeof renderWelcomeEmail>[0]);
    case "registration-completed":
      return renderRegistrationCompletedEmail(params as Parameters<typeof renderRegistrationCompletedEmail>[0]);
    case "password-changed":
      return renderPasswordChangedEmail(params as Parameters<typeof renderPasswordChangedEmail>[0]);
    case "order-placed":
      return renderOrderPlacedEmail(params as Parameters<typeof renderOrderPlacedEmail>[0]);
    case "appointment-scheduled":
      return renderAppointmentScheduledEmail(params as Parameters<typeof renderAppointmentScheduledEmail>[0]);
    case "notification":
      return renderNotificationEmail(params as Parameters<typeof renderNotificationEmail>[0]);
    default:
      throw new Error(`Template de e-mail desconhecido: ${String(template)}`);
  }
}
