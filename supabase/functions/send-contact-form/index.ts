import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_CONTACT = "Vittare <hola@vittare.mx>";
const TEAM_EMAIL   = "hola@vittare.mx";

const subjectLabels: Record<string, string> = {
  info:      "Información general",
  therapist: "Preguntas sobre terapeutas",
  pricing:   "Preguntas sobre precios",
  technical: "Soporte técnico",
  other:     "Otro",
};

// ─── Branded email builder ─────────────────────────────────────────────────────

function buildEmail(body: string, previewText = ""): string {
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&zwnj;&nbsp;</div>`
    : ""
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vittare</title></head>
<body style="margin:0;padding:0;background-color:#F4F7F4;font-family:Arial,Helvetica,sans-serif;">
${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F7F4;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
  <tr>
    <td style="background-color:#1F4D2E;border-radius:12px 12px 0 0;padding:28px 40px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#FFFFFF;font-style:italic;">vittare</span><br>
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:9px;color:rgba(255,255,255,0.50);letter-spacing:3.5px;text-transform:uppercase;">RECONECTA CONTIGO</span>
    </td>
  </tr>
  <tr>
    <td style="background-color:#FFFFFF;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;padding:40px 40px 32px;">
      ${body}
    </td>
  </tr>
  <tr><td style="background-color:#12A357;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr>
    <td style="background-color:#F4F7F4;border-radius:0 0 12px 12px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;padding:28px 40px;text-align:center;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;margin:0 0 6px;">¿Tienes dudas? Estamos aquí para ayudarte.</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0 0 16px;">
        <a href="mailto:hola@vittare.mx" style="color:#12A357;text-decoration:none;">hola@vittare.mx</a>
        <span style="color:#D1D5DB;"> · </span>
        <a href="https://vittare.mx" style="color:#12A357;text-decoration:none;">vittare.mx</a>
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;margin:0 0 4px;">Vittare · Ciudad de México, México</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;margin:0;">
        <a href="https://vittare.mx/privacidad" style="color:#9CA3AF;">Aviso de privacidad</a>
        <span style="color:#D1D5DB;"> · </span>
        <a href="https://vittare.mx/terminos" style="color:#9CA3AF;">Términos de uso</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const subjectLabel = subjectLabels[subject] || subject || "Contacto";

    if (resendKey) {
      // Email interno al equipo
      const teamHtml = buildEmail(
        `<h1 style="font-family:Georgia,serif;font-size:24px;color:#1F4D2E;font-weight:normal;margin:0 0 20px 0;">Nuevo mensaje de contacto.</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E8F5EE;border-left:3px solid #12A357;border-radius:0 8px 8px 0;margin:0 0 20px 0;">
          <tr><td style="padding:16px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#6B7280;padding:6px 0;padding-right:16px;white-space:nowrap;">Nombre</td><td style="font-family:Arial,sans-serif;font-size:14px;color:#1F2937;font-weight:600;padding:6px 0;">${name}</td></tr>
              <tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#6B7280;padding:6px 0;padding-right:16px;white-space:nowrap;">Email</td><td style="font-family:Arial,sans-serif;font-size:14px;color:#1F2937;font-weight:600;padding:6px 0;"><a href="mailto:${email}" style="color:#12A357;text-decoration:none;">${email}</a></td></tr>
              <tr><td style="font-family:Arial,sans-serif;font-size:14px;color:#6B7280;padding:6px 0;padding-right:16px;white-space:nowrap;">Motivo</td><td style="font-family:Arial,sans-serif;font-size:14px;color:#1F2937;font-weight:600;padding:6px 0;">${subjectLabel}</td></tr>
            </table>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
          <tr><td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;">
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B7280;margin:0 0 8px;font-weight:600;">Mensaje:</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F2937;margin:0;white-space:pre-wrap;">${message}</p>
          </td></tr>
        </table>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B7280;margin:0;">Responde directamente a <a href="mailto:${email}" style="color:#12A357;">${email}</a></p>`,
        `[Contacto] ${subjectLabel} — ${name}`
      );

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_CONTACT,
          to: TEAM_EMAIL,
          reply_to: email,
          subject: `[Contacto] ${subjectLabel} — ${name}`,
          html: teamHtml,
        }),
      });

      // Confirmación al usuario
      const userHtml = buildEmail(
        `<h1 style="font-family:Georgia,serif;font-size:24px;color:#1F4D2E;font-weight:normal;margin:0 0 20px 0;">Recibimos tu mensaje, ${name}.</h1>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 20px 0;">Gracias por escribirnos. Nuestro equipo revisará tu mensaje y te responderá en menos de 24 horas.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
          <tr><td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;">
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B7280;margin:0 0 8px;font-weight:600;">Tu mensaje:</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F2937;margin:0;white-space:pre-wrap;">${message}</p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr><td style="border-top:1px solid #E5E7EB;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#6B7280;margin:0 0 16px 0;">Si tienes alguna urgencia, escríbenos directamente a <a href="mailto:hola@vittare.mx" style="color:#12A357;">hola@vittare.mx</a></p>
        <p style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#6B7280;font-style:italic;margin:0;">Con gusto te atendemos. — El equipo de Vittare</p>`,
        "Recibimos tu mensaje — te responderemos en menos de 24 horas"
      );

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_CONTACT,
          to: email,
          subject: "Recibimos tu mensaje — Vittare",
          html: userHtml,
        }),
      });
    }

    // Save to DB
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await adminClient.from("contact_messages").insert({ name, email, subject, message }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-contact-form error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
