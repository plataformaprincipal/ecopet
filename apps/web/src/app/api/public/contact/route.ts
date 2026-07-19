import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { checkDistributedRateLimit, clientIp } from "@/lib/rate-limit";
import { requireTurnstile, TURNSTILE_ACTIONS } from "@/lib/turnstile/server";
import { sendEmail } from "@/lib/email/email-service";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  turnstileToken: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!(await checkDistributedRateLimit(`contact:${ip}`, 8, 60 * 60 * 1000))) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde antes de tentar novamente.", 429);
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return apiFailure("VALIDATION", "Dados inválidos", 400);
    }

    const turnstileError = await requireTurnstile({
      token: parsed.data.turnstileToken,
      expectedAction: TURNSTILE_ACTIONS.CONTACT_FORM,
      request,
      remoteIp: ip,
      flow: "contact_form",
    });
    if (turnstileError) return turnstileError;

    const supportTo =
      process.env.EMAIL_SUPPORT?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      process.env.EMAIL_REPLY_TO?.trim();

    if (!supportTo) {
      return apiFailure(
        "EMAIL_NOT_CONFIGURED",
        "Serviço de contato temporariamente indisponível.",
        503
      );
    }

    const { name, email, subject, message } = parsed.data;
    const result = await sendEmail({
      to: supportTo,
      replyTo: email,
      subject: `[EcoPet Contato] ${subject}`,
      html: `<p><strong>Nome:</strong> ${escapeHtml(name)}</p>
<p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
<p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
<p><strong>Mensagem:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
      text: `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject}\n\n${message}`,
      logPrefix: "[contact]",
    });

    if (!result.sent) {
      return apiFailure(
        "SEND_FAILED",
        "Não foi possível enviar. Tente novamente mais tarde.",
        503
      );
    }

    return apiSuccess({
      message: "Mensagem recebida. Entraremos em contato em breve.",
    });
  } catch {
    return apiFailure("UNEXPECTED", "Não foi possível enviar. Tente novamente.", 500);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
