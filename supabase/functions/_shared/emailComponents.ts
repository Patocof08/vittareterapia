// ─── Vittare Email Components ─────────────────────────────────────────────────
// Reusable HTML snippets. All styles inline, table-based where needed.

/** H1 heading */
export function emailH1(text: string): string {
  return `<h1 class="h1" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#1F4D2E;font-weight:normal;margin:0 0 20px 0;">${text}</h1>`
}

/** H2 heading */
export function emailH2(text: string): string {
  return `<h2 style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#1F4D2E;font-weight:normal;margin:0 0 16px 0;">${text}</h2>`
}

/** Body paragraph */
export function emailP(text: string, muted = false): string {
  const color = muted ? '#6B7280' : '#1F2937'
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:${color};margin:0 0 16px 0;">${text}</p>`
}

/** Small / secondary text */
export function emailSmall(text: string): string {
  return `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6B7280;margin:0 0 12px 0;">${text}</p>`
}

/** CTA button — primary (green filled) or ghost (green outline) */
export function emailButton(href: string, label: string, variant: 'primary' | 'ghost' = 'primary'): string {
  const isPrimary = variant === 'primary'
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:8px;background-color:${isPrimary ? '#12A357' : 'transparent'};border:${isPrimary ? 'none' : '2px solid #12A357'};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:${isPrimary ? '#FFFFFF' : '#12A357'};text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr>
</table>`
}

/** Horizontal rule */
export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #E5E7EB;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
}

/**
 * Highlighted info box — for session details, important data.
 * Rows: array of [label, value] pairs.
 */
export function emailHighlight(rows: [string, string][]): string {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;padding:6px 0;white-space:nowrap;padding-right:16px;">${label}</td>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1F2937;font-weight:600;padding:6px 0;">${value}</td>
    </tr>`).join('')

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8F5EE;border-left:3px solid #12A357;border-radius:0 8px 8px 0;margin:20px 0;">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        ${rowsHtml}
      </table>
    </td>
  </tr>
</table>`
}

/**
 * Alert box — success / warning / info / danger.
 */
export function emailAlert(message: string, variant: 'success' | 'warning' | 'info' | 'danger' = 'info'): string {
  const configs = {
    success: { bg: '#E8F5EE', border: '#12A357', color: '#1F4D2E' },
    warning: { bg: '#FEF9E7', border: '#F5C243', color: '#92400E' },
    info:    { bg: '#EFF6FF', border: '#3B82F6', color: '#1E3A5F' },
    danger:  { bg: '#FEF2F2', border: '#EF4444', color: '#991B1B' },
  }
  const { bg, border, color } = configs[variant]
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="background-color:${bg};border:1px solid ${border};border-radius:8px;padding:14px 18px;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${color};margin:0;">${message}</p>
    </td>
  </tr>
</table>`
}

/** Italic closing quote / sign-off text */
export function emailSignOff(text: string): string {
  return `<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B7280;font-style:italic;margin:24px 0 0 0;">${text}</p>`
}
