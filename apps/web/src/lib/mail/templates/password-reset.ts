import { emailLayout, primaryButton } from "./base";

export function passwordResetEmail(link: string, userName?: string) {
  const greeting = userName ? `Olá, ${userName}` : "Olá";
  const subject = "Redefinição de senha — EcoPet";
  const text = [
    `${greeting},`,
    "",
    "Recebemos uma solicitação para redefinir sua senha no EcoPet.",
    "",
    `Acesse o link abaixo (válido por 30 minutos):`,
    link,
    "",
    "Se você não solicitou esta redefinição, ignore este e-mail.",
  ].join("\n");

  const html = emailLayout(
    `
      <h2 style="margin:0 0 12px;color:#166534;">Redefinição de senha</h2>
      <p style="margin:0 0 16px;">${greeting},</p>
      <p style="margin:0 0 16px;">Recebemos uma solicitação para redefinir sua senha no <strong>EcoPet</strong>.</p>
      ${primaryButton("Redefinir senha", link)}
      <p style="font-size:14px;color:#555;margin:16px 0 0;">Ou copie e cole este link no navegador:<br><a href="${link}" style="color:#166534;word-break:break-all;">${link}</a></p>
      <p style="font-size:13px;color:#777;margin-top:24px;">Este link expira em <strong>30 minutos</strong>. Se você não solicitou, ignore este e-mail.</p>
    `,
    "Redefina sua senha EcoPet — link válido por 30 minutos."
  );

  return { subject, text, html };
}
