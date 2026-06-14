import { sendTransactionalEmail, type TransactionalEmailEvent } from "@/lib/mail/transactional";
import { passwordResetEmail } from "@/lib/mail/templates/password-reset";
import { welcomeEmail } from "@/lib/mail/templates/welcome";
import { getAppUrl } from "@/lib/mail/config";

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

export async function emailRegisterCompleted(to: string, name: string) {
  const tpl = welcomeEmail(name, getAppUrl());
  await dispatchEmail("REGISTER_COMPLETED", to, tpl.subject, tpl.text, tpl.html);
}

export async function emailPasswordReset(to: string, resetUrl: string, name?: string) {
  const tpl = passwordResetEmail(resetUrl, name);
  await dispatchEmail("PASSWORD_RESET", to, tpl.subject, tpl.text, tpl.html, { requireDelivery: false });
}

export async function emailAppointmentEvent(
  event: Extract<
    TransactionalEmailEvent,
    "APPOINTMENT_CREATED" | "APPOINTMENT_CONFIRMED" | "APPOINTMENT_CANCELLED" | "APPOINTMENT_COMPLETED"
  >,
  to: string,
  subject: string,
  body: string
) {
  await dispatchEmail(event, to, subject, body, `<p>${body}</p>`);
}

export async function emailOrderEvent(
  event: Extract<TransactionalEmailEvent, "ORDER_CREATED" | "ORDER_CONFIRMED" | "ORDER_CANCELLED" | "ORDER_COMPLETED">,
  to: string,
  orderNumber: number,
  body: string
) {
  const subject = `Pedido #${orderNumber} — EcoPet`;
  await dispatchEmail(event, to, subject, body, `<p>${body}</p>`);
}
