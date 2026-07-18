export type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

export type EmailTemplateName =
  | "password-recovery"
  | "otp-code"
  | "welcome"
  | "registration-completed"
  | "password-changed"
  | "order-placed"
  | "appointment-scheduled"
  | "notification"
  | "partner-approved"
  | "partner-rejected"
  | "ong-approved"
  | "ong-rejected"
  | "order-updated"
  | "order-shipped"
  | "quote-available"
  | "purchase-confirmation"
  | "contact"
  | "support"
  | "admin-notification"
  | "test-email";
