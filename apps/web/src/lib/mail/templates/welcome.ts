import { emailLayout, primaryButton } from "./base";

export function welcomeEmail(userName: string, appUrl: string) {
  const subject = "Bem-vindo ao EcoPet!";
  const text = `Olá, ${userName}!\n\nSua conta no EcoPet foi criada com sucesso.\nAcesse: ${appUrl}`;
  const html = emailLayout(
    `
      <h2 style="margin:0 0 12px;color:#166534;">Bem-vindo ao EcoPet!</h2>
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Sua conta foi criada com sucesso. Estamos felizes em ter você conosco.</p>
      ${primaryButton("Acessar EcoPet", appUrl)}
    `,
    `Bem-vindo ao EcoPet, ${userName}!`
  );
  return { subject, text, html };
}
