import { emailLayout, primaryButton } from "./base";

export function emailVerificationEmail(userName: string, verifyLink: string) {
  const subject = "Verifique seu e-mail — EcoPet";
  const text = `Olá, ${userName}!\n\nConfirme seu e-mail acessando:\n${verifyLink}`;
  const html = emailLayout(
    `
      <h2 style="margin:0 0 12px;color:#166534;">Verificação de e-mail</h2>
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Confirme seu endereço de e-mail para ativar sua conta.</p>
      ${primaryButton("Verificar e-mail", verifyLink)}
      <p style="font-size:13px;color:#777;margin-top:24px;">Este link expira em <strong>24 horas</strong>.</p>
    `,
    "Verifique seu e-mail EcoPet."
  );
  return { subject, text, html };
}
