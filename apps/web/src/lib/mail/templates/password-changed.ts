import { emailLayout, primaryButton } from "./base";

export function passwordChangedEmail(userName: string, loginUrl: string) {
  const subject = "Senha alterada — EcoPet";
  const text = `Olá, ${userName}!\n\nSua senha foi alterada com sucesso.\nSe não foi você, entre em contato imediatamente.\nLogin: ${loginUrl}`;
  const html = emailLayout(
    `
      <h2 style="margin:0 0 12px;color:#166534;">Senha alterada</h2>
      <p>Olá, <strong>${userName}</strong>!</p>
      <p>Sua senha foi alterada com sucesso.</p>
      <p style="color:#777;font-size:14px;">Se você não realizou esta alteração, entre em contato conosco imediatamente.</p>
      ${primaryButton("Fazer login", loginUrl)}
    `,
    "Sua senha EcoPet foi alterada."
  );
  return { subject, text, html };
}
