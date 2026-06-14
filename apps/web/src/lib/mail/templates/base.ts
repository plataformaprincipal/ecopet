export function emailLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>EcoPet</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 16px !important; }
      .btn { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:24px;font-weight:bold;color:#166534;letter-spacing:-0.5px;">🐾 EcoPet</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;font-size:12px;color:#888;border-top:1px solid #e5e7eb;">
              EcoPet — ecossistema pet inteligente<br />
              Este é um e-mail automático. Não responda diretamente.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function primaryButton(label: string, href: string): string {
  return `<a class="btn" href="${href}" style="background:#166534;color:#ffffff;padding:14px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;margin:16px 0;">${label}</a>`;
}
