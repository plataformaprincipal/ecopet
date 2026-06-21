import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { getResendApiKey } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/mail/config";
import {
  renderPasswordRecoveryEmail,
  renderWelcomeEmail,
  renderRegistrationCompletedEmail,
  renderOtpCodeEmail,
  renderPasswordChangedEmail,
  renderOrderPlacedEmail,
  renderAppointmentScheduledEmail,
  renderNotificationEmail,
  resolveEmailLocale,
  type EmailTemplateName,
} from "@/lib/email/templates";

const TEST_TO = "arthuralves2307@gmail.com";

const SAMPLE = {
  name: "Arthur",
  role: "CLIENT",
  code: "847291",
  orderNumber: 1042,
  serviceName: "Consulta Veterinária",
};

function renderSample(template: EmailTemplateName, locale: ReturnType<typeof resolveEmailLocale>) {
  const appUrl = getAppUrl();
  switch (template) {
    case "password-recovery":
      return renderPasswordRecoveryEmail({ locale, appUrl, name: SAMPLE.name, code: SAMPLE.code });
    case "otp-code":
      return renderOtpCodeEmail({ locale, appUrl, code: SAMPLE.code });
    case "welcome":
      return renderWelcomeEmail({ locale, appUrl, name: SAMPLE.name, role: SAMPLE.role });
    case "registration-completed":
      return renderRegistrationCompletedEmail({ locale, appUrl, name: SAMPLE.name, role: SAMPLE.role });
    case "password-changed":
      return renderPasswordChangedEmail({ locale, appUrl, name: SAMPLE.name });
    case "order-placed":
      return renderOrderPlacedEmail({ locale, appUrl, name: SAMPLE.name, orderNumber: SAMPLE.orderNumber });
    case "appointment-scheduled":
      return renderAppointmentScheduledEmail({ locale, appUrl, name: SAMPLE.name, serviceName: SAMPLE.serviceName });
    case "notification":
      return renderNotificationEmail({
        locale,
        appUrl,
        title: "Notificação EcoPet",
        message: "Este é um e-mail de teste do template de notificações.",
      });
    default:
      return renderPasswordRecoveryEmail({ locale, appUrl, name: SAMPLE.name, code: SAMPLE.code });
  }
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_RESEND !== "1") {
    return NextResponse.json(
      { success: false, error: "Rota de teste desabilitada em produção." },
      { status: 403 }
    );
  }

  if (!getResendApiKey()) {
    return NextResponse.json(
      {
        success: false,
        status: "RESEND_API_KEY_MISSING",
        error: { message: "RESEND_API_KEY não está definida em apps/web/.env" },
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const template = (searchParams.get("template") ?? "password-recovery") as EmailTemplateName;
  const locale = resolveEmailLocale(searchParams.get("locale") ?? "pt-BR");

  const rendered = renderSample(template, locale);

  const result = await sendEmail({
    to: TEST_TO,
    subject: `[TEST] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    logPrefix: "[test-email-template]",
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        success: false,
        template,
        locale,
        error: result.error ?? null,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    status: "SENT",
    template,
    locale,
    emailId: result.id ?? null,
    subject: rendered.subject,
    to: TEST_TO,
    note: "Use ?template=welcome&locale=en para testar outros templates e idiomas.",
  });
}
