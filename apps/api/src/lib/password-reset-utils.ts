import crypto from "crypto";

export const FORGOT_PASSWORD_MESSAGE =
  "Se o e-mail estiver cadastrado, enviaremos instruções para redefinição da senha.";

export const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

export const RESET_RATE_LIMITS = {
  maxPerEmailPerHour: 5,
  maxPerIpPerHour: 10,
  maxResetAttemptsPerIpPerHour: 15,
} as const;

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateResetPasswordFields(
  novaSenha: string,
  confirmarNovaSenha: string
): { valid: true } | { valid: false; error: string; code: string } {
  if (novaSenha.length < 8) {
    return { valid: false, error: "A senha deve ter no mínimo 8 caracteres.", code: "WEAK_PASSWORD" };
  }
  if (novaSenha !== confirmarNovaSenha) {
    return { valid: false, error: "As senhas não conferem.", code: "PASSWORD_MISMATCH" };
  }
  return { valid: true };
}

export function resolveAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.WEB_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function buildPasswordResetEmailBody(resetLink: string): string {
  return `Olá,

Recebemos uma solicitação para redefinir sua senha na EcoPet.

Clique no link abaixo para criar uma nova senha:

${resetLink}

Este link expira em 30 minutos.

Se você não solicitou essa alteração, ignore este e-mail.

Equipe EcoPet`;
}

export function buildPasswordResetEmailHtml(resetLink: string): string {
  const escaped = resetLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:system-ui,sans-serif;color:#102015;line-height:1.6">
<p>Olá,</p>
<p>Recebemos uma solicitação para redefinir sua senha na EcoPet.</p>
<p><a href="${escaped}" style="color:#0f5a2a;font-weight:600">Clique aqui para criar uma nova senha</a></p>
<p style="word-break:break-all;font-size:14px;color:#4a4a5a">${escaped}</p>
<p>Este link expira em 30 minutos.</p>
<p>Se você não solicitou essa alteração, ignore este e-mail.</p>
<p>Equipe EcoPet</p>
</body>
</html>`;
}
