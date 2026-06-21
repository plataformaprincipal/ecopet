import { EMAIL_BRAND, getEmailLogoUrl } from "@/lib/email/templates/constants";
import { escapeHtml } from "@/lib/email/templates/utils";

export function emailHeader(appUrl: string): string {
  const logoUrl = getEmailLogoUrl(appUrl);
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td align="center" style="padding-bottom:24px;border-bottom:1px solid ${EMAIL_BRAND.border};">
      <img
        src="${logoUrl}"
        alt="EcoPet — ecossistema pet inteligente"
        width="140"
        height="40"
        style="display:block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;"
      />
      <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:${EMAIL_BRAND.primary};letter-spacing:-0.3px;font-family:Arial,Helvetica,sans-serif;">
        EcoPet
      </p>
    </td>
  </tr>
</table>`;
}

export function emailButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" bgcolor="${EMAIL_BRAND.accent}" style="border-radius:10px;background-color:${EMAIL_BRAND.accent};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="20%" strokecolor="${EMAIL_BRAND.accent}" fillcolor="${EMAIL_BRAND.accent}">
        <w:anchorlock/>
        <center style="color:${EMAIL_BRAND.buttonText};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:${EMAIL_BRAND.buttonText};text-decoration:none;border-radius:10px;background-color:${EMAIL_BRAND.accent};min-width:200px;text-align:center;">
        ${safeLabel}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

export function emailOtpBlock(code: string, label: string): string {
  const safeCode = escapeHtml(code);
  const safeLabel = escapeHtml(label);
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
  <tr>
    <td align="center" style="background-color:${EMAIL_BRAND.cream};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;padding:24px 16px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${EMAIL_BRAND.textMuted};font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">
        ${safeLabel}
      </p>
      <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:${EMAIL_BRAND.primary};font-family:'Courier New',Courier,monospace;line-height:1.2;">
        ${safeCode}
      </p>
    </td>
  </tr>
</table>`;
}

export function emailTitle(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${EMAIL_BRAND.primary};font-family:Arial,Helvetica,sans-serif;line-height:1.3;">${escapeHtml(text)}</h1>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${EMAIL_BRAND.text};font-family:Arial,Helvetica,sans-serif;">${text}</p>`;
}

export function emailMuted(text: string): string {
  return `<p style="margin:0 0 12px;font-size:13px;line-height:1.55;color:${EMAIL_BRAND.textMuted};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(text)}</p>`;
}

export function emailInfoRow(label: string, value: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 16px;background:${EMAIL_BRAND.background};border-radius:8px;">
  <tr>
    <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;">
      <span style="display:block;font-size:12px;color:${EMAIL_BRAND.textMuted};margin-bottom:4px;">${escapeHtml(label)}</span>
      <span style="display:block;font-size:15px;font-weight:600;color:${EMAIL_BRAND.text};">${escapeHtml(value)}</span>
    </td>
  </tr>
</table>`;
}
