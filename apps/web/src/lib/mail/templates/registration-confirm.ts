import { emailLayout, primaryButton } from "./base";

export function registrationConfirmEmail(userName: string, appUrl: string) {
  const subject = "Cadastro confirmado — EcoPet";
  const text = `Olá, ${userName}!\n\nSeu cadastro no EcoPet foi confirmado.\nAcesse: ${appUrl}`;
  const html = emailLayout(
    `
      <h2 style="margin:0 0 12px;color:#166534;">Cadastro confirmado</h2>
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Seu cadastro no EcoPet foi confirmado com sucesso.</p>
      ${primaryButton("Acessar minha conta", appUrl)}
    `,
    "Seu cadastro no EcoPet foi confirmado."
  );
  return { subject, text, html };
}
