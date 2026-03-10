import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const subjectLabels: Record<string, string> = {
  info: "Información general",
  therapist: "Preguntas sobre terapeutas",
  pricing: "Preguntas sobre precios",
  technical: "Soporte técnico",
  other: "Otro",
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
      // Send notification to Vittare team
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Vittare Contacto <contacto@vittareterapia.com>",
          to: "contacto@vittareterapia.com",
          reply_to: email,
          subject: `[Contacto] ${subjectLabel} — ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Nuevo mensaje de contacto</h2>
              <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Nombre:</td><td style="padding: 8px;">${name}</td></tr>
                <tr style="background:#f9f9f9;"><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Motivo:</td><td style="padding: 8px;">${subjectLabel}</td></tr>
              </table>
              <div style="background:#f9f9f9; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px;">
                <p style="margin:0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
          `,
        }),
      });

      // Send confirmation to user
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Vittare <contacto@vittareterapia.com>",
          to: email,
          subject: "Recibimos tu mensaje — Vittare",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Hola ${name}, recibimos tu mensaje</h2>
              <p style="color: #555;">Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderá en menos de 24 horas.</p>
              <div style="background:#f9f9f9; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin:0; font-weight: bold; color: #333;">Tu mensaje:</p>
                <p style="margin: 8px 0 0; white-space: pre-wrap; color: #555;">${message}</p>
              </div>
              <p style="color: #555;">Si tienes alguna urgencia, también puedes escribirnos directamente a <a href="mailto:contacto@vittareterapia.com">contacto@vittareterapia.com</a>.</p>
              <p style="color: #555;">— El equipo de Vittare</p>
            </div>
          `,
        }),
      });
    }

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    await adminClient.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
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
