import { sendPlatformEmail } from "@/lib/email/provider";
import { sendTransactionalEmail, type TransactionalEmailEvent } from "@/lib/mail/transactional";
import { getAppUrl } from "@/lib/mail/config";
import { sendPasswordRecoveryOtpEmail } from "@/lib/email/password-recovery-email";
import {
  renderRegistrationCompletedEmail,
  renderPasswordRecoveryEmail,
  renderOrderPlacedEmail,
  renderAppointmentScheduledEmail,
  renderNotificationEmail,
  renderPasswordChangedEmail,
  renderPartnerApprovedEmail,
  renderPartnerRejectedEmail,
  renderOngApprovedEmail,
  renderOngRejectedEmail,
  renderOrderUpdatedEmail,
  renderOrderShippedEmail,
  renderPurchaseConfirmationEmail,
  renderAdminNotificationEmail,
  getUserEmailLocale,
  type EmailLocale,
} from "@/lib/email/templates";

/** Dispara e-mail transacional sem interromper o fluxo principal. */
export async function dispatchEmail(
  event: TransactionalEmailEvent,
  to: string,
  subject: string,
  text: string,
  html: string,
  options?: { requireDelivery?: boolean }
) {
  try {
    await sendTransactionalEmail({ event, to, subject, text, html, requireDelivery: options?.requireDelivery });
  } catch {
    if (options?.requireDelivery) throw new Error("EMAIL_NOT_CONFIGURED");
  }
}

/**
 * Envia e-mail transacional (templates premium EcoPet) através do dispatcher
 * multi-provedor `sendPlatformEmail` (Resend → SendGrid → Brevo → SMTP),
 * preservando o fallback de desenvolvimento (console) quando nada está
 * configurado. Não interrompe o fluxo principal (requireDelivery=false).
 */
export async function dispatchPremiumEmail(params: {
  event: TransactionalEmailEvent;
  to: string;
  subject: string;
  html: string;
  text: string;
  logPrefix?: string;
}) {
  return sendPlatformEmail({
    event: params.event,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export async function emailRegisterCompleted(
  to: string,
  name: string,
  role: string,
  locale?: EmailLocale
) {
  const resolvedLocale = locale ?? "pt-BR";
  const tpl = renderRegistrationCompletedEmail({
    locale: resolvedLocale,
    appUrl: getAppUrl(),
    name,
    role,
  });
  await dispatchPremiumEmail({
    event: "REGISTER_COMPLETED",
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: "[register]",
  });
}

export async function emailPasswordReset(
  to: string,
  _resetUrl: string,
  options?: { name?: string; code?: string; locale?: EmailLocale }
) {
  const locale = options?.locale ?? "pt-BR";
  const tpl = renderPasswordRecoveryEmail({
    locale,
    appUrl: getAppUrl(),
    name: options?.name ?? to.split("@")[0] ?? "Usuário",
    code: options?.code ?? "000000",
  });
  await dispatchPremiumEmail({
    event: "PASSWORD_RESET",
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: "[password-reset]",
  });
}

export async function emailPasswordResetOtp(
  to: string,
  code: string,
  options?: { name?: string; locale?: EmailLocale }
) {
  return sendPasswordRecoveryOtpEmail(to, code, options);
}

export async function emailPasswordChanged(
  to: string,
  name: string,
  locale?: EmailLocale
) {
  const tpl = renderPasswordChangedEmail({
    locale: locale ?? "pt-BR",
    appUrl: getAppUrl(),
    name,
  });
  await dispatchPremiumEmail({
    event: "PASSWORD_CHANGED",
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: "[password-changed]",
  });
}

export async function emailAppointmentEvent(
  event: Extract<
    TransactionalEmailEvent,
    "APPOINTMENT_CREATED" | "APPOINTMENT_CONFIRMED" | "APPOINTMENT_CANCELLED" | "APPOINTMENT_COMPLETED"
  >,
  to: string,
  params: {
    name: string;
    serviceName: string;
    locale?: EmailLocale;
    title?: string;
    message?: string;
  }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl =
    event === "APPOINTMENT_CREATED"
      ? renderAppointmentScheduledEmail({
          locale,
          appUrl: getAppUrl(),
          name: params.name,
          serviceName: params.serviceName,
        })
      : renderNotificationEmail({
          locale,
          appUrl: getAppUrl(),
          title: params.title,
          message: params.message ?? params.serviceName,
        });

  await dispatchPremiumEmail({
    event,
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: `[appointment:${event}]`,
  });
}

export async function emailOrderEvent(
  event: Extract<TransactionalEmailEvent, "ORDER_CREATED" | "ORDER_CONFIRMED" | "ORDER_CANCELLED" | "ORDER_COMPLETED">,
  to: string,
  orderNumber: number,
  params: { name: string; locale?: EmailLocale; message?: string; title?: string; statusLabel?: string }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl =
    event === "ORDER_CREATED"
      ? renderOrderPlacedEmail({
          locale,
          appUrl: getAppUrl(),
          name: params.name,
          orderNumber,
        })
      : event === "ORDER_CONFIRMED"
        ? renderPurchaseConfirmationEmail({
            locale,
            appUrl: getAppUrl(),
            name: params.name,
            orderNumber,
          })
        : event === "ORDER_COMPLETED"
          ? renderOrderUpdatedEmail({
              locale,
              appUrl: getAppUrl(),
              name: params.name,
              orderNumber,
              statusLabel: params.statusLabel ?? (locale === "en" ? "Completed" : "Concluído"),
            })
          : renderOrderUpdatedEmail({
              locale,
              appUrl: getAppUrl(),
              name: params.name,
              orderNumber,
              statusLabel: params.statusLabel ?? params.message ?? (locale === "en" ? "Updated" : "Atualizado"),
            });

  await dispatchPremiumEmail({
    event,
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: `[order:${event}]`,
  });
}

export async function emailPartnerDecision(
  event: "PARTNER_APPROVED" | "PARTNER_REJECTED",
  to: string,
  params: { name: string; reason?: string; locale?: EmailLocale }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl =
    event === "PARTNER_APPROVED"
      ? renderPartnerApprovedEmail({ locale, appUrl: getAppUrl(), name: params.name })
      : renderPartnerRejectedEmail({
          locale,
          appUrl: getAppUrl(),
          name: params.name,
          reason: params.reason ?? "—",
        });
  await dispatchPremiumEmail({
    event,
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: `[${event}]`,
  });
}

export async function emailOngDecision(
  event: "ONG_APPROVED" | "ONG_REJECTED",
  to: string,
  params: { name: string; reason?: string; locale?: EmailLocale }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl =
    event === "ONG_APPROVED"
      ? renderOngApprovedEmail({ locale, appUrl: getAppUrl(), name: params.name })
      : renderOngRejectedEmail({
          locale,
          appUrl: getAppUrl(),
          name: params.name,
          reason: params.reason ?? "—",
        });
  await dispatchPremiumEmail({
    event,
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: `[${event}]`,
  });
}

export async function emailOrderShipped(
  to: string,
  params: { name: string; orderNumber: number | string; trackingCode?: string; locale?: EmailLocale }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl = renderOrderShippedEmail({
    locale,
    appUrl: getAppUrl(),
    name: params.name,
    orderNumber: params.orderNumber,
    trackingCode: params.trackingCode,
  });
  await dispatchPremiumEmail({
    event: "ORDER_CONFIRMED",
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: "[order:shipped]",
  });
}

export async function emailAdminNotice(
  to: string,
  params: { title: string; message: string; actionUrl?: string; locale?: EmailLocale }
) {
  const locale = params.locale ?? "pt-BR";
  const tpl = renderAdminNotificationEmail({
    locale,
    appUrl: getAppUrl(),
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
  });
  await dispatchPremiumEmail({
    event: "REVIEW_RECEIVED",
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    logPrefix: "[admin-notice]",
  });
}

export { getUserEmailLocale };

