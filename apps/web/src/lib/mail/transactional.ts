import { sendPlatformEmail } from "@/lib/email/provider";

export type TransactionalEmailEvent =
  | "REGISTER_COMPLETED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "PARTNER_APPROVED"
  | "PARTNER_REJECTED"
  | "PARTNER_SUSPENDED"
  | "ONG_APPROVED"
  | "ONG_REJECTED"
  | "ONG_SUSPENDED"
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_COMPLETED"
  | "REVIEW_RECEIVED"
  | "ORDER_CREATED"
  | "ORDER_CONFIRMED"
  | "ORDER_CANCELLED"
  | "ORDER_COMPLETED";

export async function sendTransactionalEmail(params: {
  event: TransactionalEmailEvent;
  to: string;
  subject: string;
  html: string;
  text: string;
  requireDelivery?: boolean;
}) {
  return sendPlatformEmail(params);
}
