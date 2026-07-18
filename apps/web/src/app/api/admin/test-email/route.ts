import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail, maskEmailForLog } from "@/lib/email/email-service";
import { renderTestEmail } from "@/lib/email/templates";
import { getAppUrl } from "@/lib/mail/config";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { getResendOperationalStatus } from "@/lib/email/resend-status";

const bodySchema = z.object({
  to: z.string().email().max(254),
});

/**
 * POST /api/admin/test-email
 * Envia e-mail de teste via Resend — apenas ADMIN.
 * Nunca retorna API key nem stack.
 */
export async function POST(request: Request) {
  const { user, error } = await requireAdmin({ path: "/api/admin/test-email" });
  if (error) return error;

  const ip = clientIp(request);
  const rateKey = `admin-test-email:${user!.id}:${ip}`;
  if (!checkAuthRateLimit(rateKey, 5, 60_000)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "EMAIL_RATE_LIMITED", message: "Limite de testes atingido. Aguarde um minuto." },
      },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "EMAIL_VALIDATION_ERROR", message: "JSON inválido." } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "EMAIL_INVALID_RECIPIENT", message: "Destinatário de e-mail inválido." },
      },
      { status: 422 }
    );
  }

  const to = parsed.data.to.trim().toLowerCase();
  const status = getResendOperationalStatus();
  if (!status.configured) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RESEND_NOT_CONFIGURED",
          message: "Resend não configurado. Defina RESEND_API_KEY.",
        },
        data: { status: status.status },
      },
      { status: 503 }
    );
  }

  const tpl = renderTestEmail({
    locale: "pt-BR",
    appUrl: getAppUrl(),
    recipient: to,
  });

  const result = await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [
      { name: "category", value: "admin_test" },
      { name: "app", value: "ecopet" },
    ],
    metadata: { actorId: user!.id },
    logPrefix: "[admin:test-email]",
  });

  await writeIntegrationLog({
    integrationName: "resend",
    provider: "Resend",
    action: "admin_test_email",
    status: result.sent ? "OK" : "FAILED",
    errorCode: result.sent ? undefined : String(result.errorCode ?? "EMAIL_SEND_FAILED"),
    message: result.sent
      ? `Teste enviado para ${maskEmailForLog(to)}`
      : result.error?.message ?? "Falha no envio de teste",
  }).catch(() => undefined);

  if (!result.sent) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.errorCode ?? "EMAIL_SEND_FAILED",
          message: result.error?.message ?? "Não foi possível enviar o e-mail de teste.",
        },
        data: {
          status: getResendOperationalStatus().status,
          emailId: null,
        },
      },
      { status: result.errorCode === "EMAIL_RATE_LIMITED" ? 429 : 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      emailId: result.id ?? null,
      to: maskEmailForLog(to),
      status: getResendOperationalStatus().status,
      domainNote:
        status.status === "DOMAIN_PENDING"
          ? "Envio realizado; domínio ainda pendente de verificação completa no Resend."
          : undefined,
    },
  });
}
