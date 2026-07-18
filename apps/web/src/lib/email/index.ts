export { sendPlatformEmail, assertEmailConfigured, type EmailSendResult } from "@/lib/email/provider";
export { sendEmail, sendViaResendSdk, maskEmailForLog, type SendEmailParams, type SendEmailResult } from "@/lib/email/email-service";
export {
  getResendClient,
  getResendApiKey,
  getResendFromAddress,
  isResendReady,
} from "@/lib/email/resend";
export {
  getEmailFromAddress,
  getEmailReplyTo,
  getEmailSupportAddress,
  getEmailProvider,
  isResendConfigured,
} from "@/lib/email/config";
export { getResendOperationalStatus, type ResendOperationalStatus } from "@/lib/email/resend-status";
