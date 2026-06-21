import { EMAIL_BRAND } from "@/lib/email/templates/constants";
import type { EmailLocale } from "@/lib/email/templates/locale";
import { emailHtmlLang } from "@/lib/email/templates/locale";
import { getEmailCopy } from "@/lib/email/templates/i18n/copy";
import { escapeHtml } from "@/lib/email/templates/utils";

export function emailFooter(locale: EmailLocale): string {
  const { common } = getEmailCopy(locale);
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px;border-top:1px solid ${EMAIL_BRAND.border};">
  <tr>
    <td style="padding-top:24px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${EMAIL_BRAND.primary};">
        ${escapeHtml(common.brandName)} — ${escapeHtml(common.footerTagline)}
      </p>
      <p style="margin:0 0 8px;font-size:12px;color:${EMAIL_BRAND.textMuted};">
        ${escapeHtml(common.autoEmail)}
      </p>
      <p style="margin:0 0 16px;font-size:12px;color:${EMAIL_BRAND.textMuted};">
        ${escapeHtml(common.support)} · ${escapeHtml(common.rights)}
      </p>
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${EMAIL_BRAND.secondary};text-transform:uppercase;letter-spacing:0.4px;">
        ${escapeHtml(common.aiSectionTitle)}
      </p>
      <p style="margin:0 0 8px;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.textMuted};">
        <strong>PT:</strong> ${escapeHtml(common.aiDisclaimerPt)}
      </p>
      <p style="margin:0 0 8px;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.textMuted};">
        <strong>EN:</strong> ${escapeHtml(common.aiDisclaimerEn)}
      </p>
      <p style="margin:0;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.textMuted};">
        <strong>ES:</strong> ${escapeHtml(common.aiDisclaimerEs)}
      </p>
    </td>
  </tr>
</table>`;
}

export function emailLayout(params: {
  locale: EmailLocale;
  previewText: string;
  content: string;
  appUrl: string;
}): string {
  const lang = emailHtmlLang(params.locale);
  const safePreview = escapeHtml(params.previewText);
  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>EcoPet</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding: 20px 16px !important; }
      .email-otp { font-size: 28px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.background};font-family:Arial,Helvetica,sans-serif;color:${EMAIL_BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${EMAIL_BRAND.background};">
    <tr>
      <td align="center" style="padding:24px 12px;" class="email-padding">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:${EMAIL_BRAND.surface};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,59,22,0.08);">
          <tr>
            <td style="padding:32px 32px 8px;" class="email-padding">
              ${params.content}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;" class="email-padding">
              ${emailFooter(params.locale)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
