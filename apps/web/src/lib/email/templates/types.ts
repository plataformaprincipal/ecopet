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
  | "notification";
