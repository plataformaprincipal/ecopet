/** Identidade visual EcoPet — compatível com qualquer remetente Resend. */
export const EMAIL_BRAND = {
  primary: "#003B16",
  secondary: "#0F5A2A",
  accent: "#166534",
  cream: "#F7F4DC",
  background: "#f4f7f5",
  surface: "#ffffff",
  text: "#102015",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  buttonText: "#ffffff",
} as const;

export const EMAIL_LOGO_PATH = "/brand/ecopet-logo.png";

export function getEmailLogoUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}${EMAIL_LOGO_PATH}`;
}
