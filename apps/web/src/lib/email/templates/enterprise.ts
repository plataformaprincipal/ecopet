/**
 * Templates enterprise adicionais (parceiro/ONG/pedidos/contato/suporte/admin).
 * Reutiliza layout EcoPet existente.
 */
import type { EmailLocale } from "@/lib/email/templates/locale";
import {
  emailHeader,
  emailButton,
  emailTitle,
  emailParagraph,
  emailMuted,
  emailInfoRow,
} from "@/lib/email/templates/components/blocks";
import { emailLayout } from "@/lib/email/templates/components/layout";
import { escapeHtml } from "@/lib/email/templates/utils";
import type { EmailTemplateResult } from "@/lib/email/templates/types";

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

type NamedParams = {
  locale: EmailLocale;
  appUrl: string;
  name: string;
};

function greet(locale: EmailLocale, name: string): string {
  if (locale === "en") return `Hello, ${name}!`;
  if (locale === "es") return `¡Hola, ${name}!`;
  return `Olá, ${name}!`;
}

export function renderPartnerApprovedEmail(
  params: NamedParams & { dashboardUrl?: string }
): EmailTemplateResult {
  const url = params.dashboardUrl ?? `${params.appUrl}/parceiro`;
  const subject =
    params.locale === "en"
      ? "Partner account approved — EcoPet"
      : params.locale === "es"
        ? "Cuenta de socio aprobada — EcoPet"
        : "Parceiro aprovado — EcoPet";
  const title =
    params.locale === "en" ? "Account approved" : params.locale === "es" ? "Cuenta aprobada" : "Conta aprovada";
  const message =
    params.locale === "en"
      ? "Your partner account was approved. You can now access the partner area."
      : params.locale === "es"
        ? "Tu cuenta de socio fue aprobada. Ya puedes acceder al área de socios."
        : "Sua conta de parceiro foi aprovada. Você já pode acessar a área do parceiro.";
  const cta = params.locale === "en" ? "Open partner area" : params.locale === "es" ? "Abrir área" : "Acessar área do parceiro";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n\n${cta}: ${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: title,
    subject,
    text,
    body,
  });
}

export function renderPartnerRejectedEmail(
  params: NamedParams & { reason: string }
): EmailTemplateResult {
  const subject =
    params.locale === "en"
      ? "Partner application update — EcoPet"
      : params.locale === "es"
        ? "Actualización de solicitud — EcoPet"
        : "Solicitação de parceiro — EcoPet";
  const title =
    params.locale === "en" ? "Application not approved" : params.locale === "es" ? "Solicitud no aprobada" : "Solicitação não aprovada";
  const message =
    params.locale === "en"
      ? "Unfortunately your partner application was not approved."
      : params.locale === "es"
        ? "Lamentablemente tu solicitud de socio no fue aprobada."
        : "Infelizmente sua solicitação de parceiro não foi aprovada.";
  const reasonLabel = params.locale === "en" ? "Reason" : params.locale === "es" ? "Motivo" : "Motivo";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${emailInfoRow(reasonLabel, escapeHtml(params.reason))}
    ${emailMuted(params.locale === "en" ? "You may contact support for more details." : "Você pode contatar o suporte para mais detalhes.")}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n${reasonLabel}: ${params.reason}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: title,
    subject,
    text,
    body,
  });
}

export function renderOngApprovedEmail(
  params: NamedParams & { dashboardUrl?: string }
): EmailTemplateResult {
  const url = params.dashboardUrl ?? `${params.appUrl}/ong`;
  const subject =
    params.locale === "en" ? "NGO account approved — EcoPet" : params.locale === "es" ? "Cuenta ONG aprobada — EcoPet" : "ONG aprovada — EcoPet";
  const title =
    params.locale === "en" ? "NGO approved" : params.locale === "es" ? "ONG aprobada" : "ONG aprovada";
  const message =
    params.locale === "en"
      ? "Your NGO account was approved. You can manage adoptions and campaigns."
      : params.locale === "es"
        ? "Tu cuenta de ONG fue aprobada. Ya puedes gestionar adopciones y campañas."
        : "Sua conta de ONG foi aprovada. Você já pode gerenciar adoções e campanhas.";
  const cta = params.locale === "en" ? "Open NGO area" : params.locale === "es" ? "Abrir área ONG" : "Acessar área da ONG";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n\n${cta}: ${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: title,
    subject,
    text,
    body,
  });
}

export function renderOngRejectedEmail(
  params: NamedParams & { reason: string }
): EmailTemplateResult {
  const subject =
    params.locale === "en" ? "NGO application update — EcoPet" : params.locale === "es" ? "Actualización ONG — EcoPet" : "Solicitação de ONG — EcoPet";
  const title =
    params.locale === "en" ? "Application not approved" : params.locale === "es" ? "Solicitud no aprobada" : "Solicitação não aprovada";
  const message =
    params.locale === "en"
      ? "Unfortunately your NGO application was not approved."
      : params.locale === "es"
        ? "Lamentablemente tu solicitud de ONG no fue aprobada."
        : "Infelizmente sua solicitação de ONG não foi aprovada.";
  const reasonLabel = params.locale === "en" ? "Reason" : params.locale === "es" ? "Motivo" : "Motivo";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${emailInfoRow(reasonLabel, escapeHtml(params.reason))}
    ${emailMuted(params.locale === "en" ? "Contact support if you need help." : "Contate o suporte se precisar de ajuda.")}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n${reasonLabel}: ${params.reason}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: title,
    subject,
    text,
    body,
  });
}

export function renderOrderUpdatedEmail(
  params: NamedParams & { orderNumber: number | string; statusLabel: string; orderUrl?: string }
): EmailTemplateResult {
  const url = params.orderUrl ?? `${params.appUrl}/pedidos`;
  const subject =
    params.locale === "en"
      ? `Order #${params.orderNumber} updated — EcoPet`
      : `Pedido #${params.orderNumber} atualizado — EcoPet`;
  const title = params.locale === "en" ? "Order updated" : "Pedido atualizado";
  const message =
    params.locale === "en"
      ? `Your order #${params.orderNumber} status is now: ${params.statusLabel}.`
      : `O status do seu pedido #${params.orderNumber} agora é: ${params.statusLabel}.`;
  const cta = params.locale === "en" ? "View order" : "Ver pedido";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n\n${cta}: ${url}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderOrderShippedEmail(
  params: NamedParams & { orderNumber: number | string; trackingCode?: string; orderUrl?: string }
): EmailTemplateResult {
  const url = params.orderUrl ?? `${params.appUrl}/pedidos`;
  const subject =
    params.locale === "en"
      ? `Order #${params.orderNumber} shipped — EcoPet`
      : `Pedido #${params.orderNumber} enviado — EcoPet`;
  const title = params.locale === "en" ? "Order shipped" : "Pedido enviado";
  const message =
    params.locale === "en"
      ? `Your order #${params.orderNumber} is on the way.`
      : `Seu pedido #${params.orderNumber} está a caminho.`;
  const tracking =
    params.trackingCode != null && params.trackingCode !== ""
      ? emailInfoRow(params.locale === "en" ? "Tracking" : "Rastreio", escapeHtml(params.trackingCode))
      : "";
  const cta = params.locale === "en" ? "Track order" : "Acompanhar pedido";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${tracking}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}${params.trackingCode ? `\nTracking: ${params.trackingCode}` : ""}\n\n${cta}: ${url}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderQuoteAvailableEmail(
  params: NamedParams & { quoteTitle: string; quoteUrl?: string }
): EmailTemplateResult {
  const url = params.quoteUrl ?? params.appUrl;
  const subject =
    params.locale === "en" ? "Quote available — EcoPet" : "Orçamento disponível — EcoPet";
  const title = params.locale === "en" ? "Quote available" : "Orçamento disponível";
  const message =
    params.locale === "en"
      ? `A new quote is ready: ${params.quoteTitle}.`
      : `Um novo orçamento está disponível: ${params.quoteTitle}.`;
  const cta = params.locale === "en" ? "View quote" : "Ver orçamento";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(escapeHtml(message))}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}\n\n${cta}: ${url}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderPurchaseConfirmationEmail(
  params: NamedParams & { orderNumber: number | string; totalLabel?: string; orderUrl?: string }
): EmailTemplateResult {
  const url = params.orderUrl ?? `${params.appUrl}/pedidos`;
  const subject =
    params.locale === "en"
      ? `Purchase confirmed #${params.orderNumber} — EcoPet`
      : `Compra confirmada #${params.orderNumber} — EcoPet`;
  const title = params.locale === "en" ? "Purchase confirmed" : "Confirmação de compra";
  const message =
    params.locale === "en"
      ? `We received your payment for order #${params.orderNumber}.`
      : `Recebemos o pagamento do pedido #${params.orderNumber}.`;
  const total =
    params.totalLabel != null && params.totalLabel !== ""
      ? emailInfoRow(params.locale === "en" ? "Total" : "Total", escapeHtml(params.totalLabel))
      : "";
  const cta = params.locale === "en" ? "View receipt" : "Ver comprovante";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${emailParagraph(message)}
    ${total}
    ${emailButton(cta, url)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${message}${params.totalLabel ? `\nTotal: ${params.totalLabel}` : ""}\n\n${cta}: ${url}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderContactEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  email: string;
  message: string;
  topic?: string;
}): EmailTemplateResult {
  const subject =
    params.locale === "en"
      ? `Contact form — ${params.name}`
      : `Contato — ${params.name}`;
  const title = params.locale === "en" ? "New contact message" : "Nova mensagem de contato";
  const body = `
    ${emailTitle(title)}
    ${emailInfoRow(params.locale === "en" ? "From" : "De", escapeHtml(params.name))}
    ${emailInfoRow("E-mail", escapeHtml(params.email))}
    ${params.topic ? emailInfoRow(params.locale === "en" ? "Topic" : "Assunto", escapeHtml(params.topic)) : ""}
    ${emailParagraph(escapeHtml(params.message))}`;
  const text = `${title}\n\n${params.name} <${params.email}>\n${params.topic ? `${params.topic}\n` : ""}${params.message}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderSupportEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  name: string;
  ticketId?: string;
  message: string;
}): EmailTemplateResult {
  const subject =
    params.locale === "en"
      ? `Support ${params.ticketId ? `#${params.ticketId} ` : ""}— EcoPet`
      : `Suporte ${params.ticketId ? `#${params.ticketId} ` : ""}— EcoPet`;
  const title = params.locale === "en" ? "Support update" : "Atualização de suporte";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(greet(params.locale, params.name))}
    ${params.ticketId ? emailInfoRow(params.locale === "en" ? "Ticket" : "Protocolo", escapeHtml(params.ticketId)) : ""}
    ${emailParagraph(escapeHtml(params.message))}
    ${emailButton(params.locale === "en" ? "Open EcoPet" : "Abrir EcoPet", params.appUrl)}`;
  const text = `${title}\n\n${greet(params.locale, params.name)}\n${params.ticketId ? `Ticket: ${params.ticketId}\n` : ""}${params.message}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}

export function renderAdminNotificationEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  title: string;
  message: string;
  actionUrl?: string;
}): EmailTemplateResult {
  const subject = `${params.title} — EcoPet Admin`;
  const url = params.actionUrl ?? `${params.appUrl}/admin`;
  const body = `
    ${emailTitle(escapeHtml(params.title))}
    ${emailParagraph(escapeHtml(params.message))}
    ${emailButton(params.locale === "en" ? "Open admin" : "Abrir admin", url)}`;
  const text = `${params.title}\n\n${params.message}\n\n${url}`;
  return build({
    locale: params.locale,
    appUrl: params.appUrl,
    previewText: params.title,
    subject,
    text,
    body,
  });
}

export function renderTestEmail(params: {
  locale: EmailLocale;
  appUrl: string;
  recipient: string;
}): EmailTemplateResult {
  const subject = "EcoPet — e-mail de teste (Resend)";
  const title = "E-mail de teste";
  const message =
    "Este é um e-mail de teste do painel administrativo EcoPet. Se você recebeu esta mensagem, a integração Resend está operacional.";
  const body = `
    ${emailTitle(title)}
    ${emailParagraph(message)}
    ${emailInfoRow("Destinatário", escapeHtml(params.recipient))}
    ${emailMuted("Nenhuma ação é necessária.")}
    ${emailButton("Abrir EcoPet", params.appUrl)}`;
  const text = `${title}\n\n${message}\nDestinatário: ${params.recipient}`;
  return build({ locale: params.locale, appUrl: params.appUrl, previewText: title, subject, text, body });
}
