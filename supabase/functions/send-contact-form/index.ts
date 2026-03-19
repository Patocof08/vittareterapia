import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout } from '../_shared/emailLayout.ts'
import {
  emailH1, emailP, emailSmall, emailButton,
  emailDivider, emailHighlight, emailAlert, emailSignOff,
} from '../_shared/emailComponents.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_CONTACT = 'Vittare Contacto <hola@vittare.mx>'
const TEAM_EMAIL   = 'hola@vittare.mx'

const subjectLabels: Record<string, string> = {
  info:      "Información general",
  therapist: "Preguntas sobre terapeutas",
  pricing:   "Preguntas sobre precios",
  technical: "Soporte técnico",
  other:     "Otro",
};

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
      // ── Email interno al equipo de Vittare ──────────────────────────────────
      const teamHtml = emailLayout(
        emailH1('Nuevo mensaje de contacto.') +
        emailHighlight([
          ['Nombre',  name],
          ['Email',   `<a href="mailto:${email}" style="color:#12A357;text-decoration:none;">${email}</a>`],
          ['Motivo',  subjectLabel],
        ]) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B7280;margin:0 0 6px 0;font-weight:600;">Mensaje:</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1F2937;margin:0;white-space:pre-wrap;">${message}</p>
            </td>
          </tr>
        </table>` +
        emailSmall(`Responde directamente a <a href="mailto:${email}" style="color:#12A357;">${email}</a>`),
        { previewText: `[Contacto] ${subjectLabel} — ${name}` }
      )

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_CONTACT,
          to: TEAM_EMAIL,
          reply_to: email,
          subject: `[Contacto] ${subjectLabel} — ${name}`,
          html: teamHtml,
        }),
      });

      // ── Confirmación al usuario ─────────────────────────────────────────────
      const userHtml = emailLayout(
        emailH1(`Recibimos tu mensaje, ${name}.`) +
        emailP('Gracias por escribirnos. Nuestro equipo revisará tu mensaje y te responderá en menos de 24 horas.') +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;margin:0 0 6px 0;font-weight:600;">Tu mensaje:</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1F2937;margin:0;white-space:pre-wrap;">${message}</p>
            </td>
          </tr>
        </table>` +
        emailDivider() +
        emailSmall(`Si tienes alguna urgencia, escríbenos directamente a <a href="mailto:hola@vittare.mx" style="color:#12A357;">hola@vittare.mx</a>`) +
        emailSignOff('Con gusto te atendemos. — El equipo de Vittare'),
        { previewText: `Recibimos tu mensaje — te responderemos en menos de 24 horas` }
      )

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_CONTACT,
          to: email,
          subject: "Recibimos tu mensaje — Vittare",
          html: userHtml,
        }),
      });
    }

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from("contact_messages").insert({
      name, email, subject, message,
    }).catch(() => {
      // Table may not exist yet — not critical
    });

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
