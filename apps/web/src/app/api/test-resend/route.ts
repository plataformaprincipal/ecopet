import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { getResendApiKey } from "@/lib/email/resend";

const TEST_TO = "arthuralves2307@gmail.com";

export async function GET() {
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
        error: {
          message:
            "RESEND_API_KEY não está definida. Adicione em apps/web/.env: RESEND_API_KEY=re_xxxxxxxxx",
        },
      },
      { status: 503 }
    );
  }

  const result = await sendEmail({
    to: TEST_TO,
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    logPrefix: "[test-resend]",
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        success: false,
        status: result.errorCode ?? "FAILED",
        emailId: null,
        data: result.data ?? null,
        error: result.error ?? null,
      },
      { status: result.errorCode === "RESEND_NOT_CONFIGURED" ? 503 : 502 }
    );
  }

  return NextResponse.json({
    success: true,
    status: "SENT",
    emailId: result.id ?? null,
    data: result.data ?? null,
    error: null,
    note: "Usa o mesmo serviço de /api/auth/forgot-password (email-service.ts)",
  });
}
