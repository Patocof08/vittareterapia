// ─── Vittare Email Layout ─────────────────────────────────────────────────────
// Pure TypeScript — no React needed (Deno edge function compatible).
// All styles inline. Table-based layout for maximum email client compatibility.

export interface EmailLayoutOptions {
  previewText?: string
}

export function emailLayout(body: string, options: EmailLayoutOptions = {}): string {
  const { previewText = '' } = options

  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Vittare</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    @media only screen and (max-width: 620px) {
      .wrapper { padding: 16px !important; }
      .card { border-radius: 8px !important; }
      .body-pad { padding: 28px 24px !important; }
      .footer-pad { padding: 24px !important; }
      .h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4F7F4;">
  ${preview}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F4;">
    <tr>
      <td align="center" class="wrapper" style="padding:40px 20px;">

        <!-- Card container — max 600px -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- ── HEADER ─────────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#1F4D2E;border-radius:12px 12px 0 0;padding:28px 40px;" class="card">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Logo text (renders in all clients without external image) -->
                    <div style="display:inline-block;">
                      <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#FFFFFF;letter-spacing:-0.5px;font-style:italic;">vittare</span>
                    </div>
                    <br>
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:9px;color:rgba(255,255,255,0.50);letter-spacing:3.5px;text-transform:uppercase;">RECONECTA CONTIGO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY CARD ──────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#FFFFFF;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;padding:40px 40px 32px;" class="body-pad">
              ${body}
            </td>
          </tr>

          <!-- ── GREEN DIVIDER ──────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#12A357;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── FOOTER ─────────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#F4F7F4;border-radius:0 0 12px 12px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;padding:28px 40px;" class="footer-pad">

              <!-- Contact links -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:6px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;">¿Tienes dudas? Estamos aquí para ayudarte.</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="mailto:hola@vittare.mx" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#12A357;text-decoration:none;">hola@vittare.mx</a>
                    <span style="font-family:Arial,sans-serif;font-size:13px;color:#9CA3AF;"> · </span>
                    <a href="https://vittare.mx" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#12A357;text-decoration:none;">vittare.mx</a>
                  </td>
                </tr>

                <!-- Social links -->
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="https://instagram.com/vittare.mx" style="font-family:Arial,sans-serif;font-size:12px;color:#6B7280;text-decoration:none;">Instagram</a>
                    <span style="font-family:Arial,sans-serif;font-size:12px;color:#D1D5DB;">  ·  </span>
                    <a href="https://tiktok.com/@vittare" style="font-family:Arial,sans-serif;font-size:12px;color:#6B7280;text-decoration:none;">TikTok</a>
                    <span style="font-family:Arial,sans-serif;font-size:12px;color:#D1D5DB;">  ·  </span>
                    <a href="https://linkedin.com/company/vittare" style="font-family:Arial,sans-serif;font-size:12px;color:#6B7280;text-decoration:none;">LinkedIn</a>
                  </td>
                </tr>

                <!-- Legal -->
                <tr>
                  <td align="center" style="padding-bottom:4px;">
                    <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">Vittare · Ciudad de México, México</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://vittare.mx/privacidad" style="font-family:Arial,sans-serif;font-size:11px;color:#9CA3AF;text-decoration:underline;">Aviso de privacidad</a>
                    <span style="font-family:Arial,sans-serif;font-size:11px;color:#C4C9D4;"> · </span>
                    <a href="https://vittare.mx/terminos" style="font-family:Arial,sans-serif;font-size:11px;color:#9CA3AF;text-decoration:underline;">Términos de uso</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
