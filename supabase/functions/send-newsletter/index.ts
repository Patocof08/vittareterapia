import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use user JWT to check role
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow admin or marketing roles
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role;
    if (role !== "admin" && role !== "marketing") {
      return new Response(JSON.stringify({ error: "Sin permisos" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the post
    const { data: post, error: postError } = await adminClient
      .from("blog_posts")
      .select("id, title, excerpt, slug, cover_image_url, newsletter_sent_at")
      .eq("id", post_id)
      .eq("status", "published")
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: "Post no encontrado o no publicado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (post.newsletter_sent_at) {
      return new Response(JSON.stringify({ error: "El newsletter ya fue enviado para este post" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active subscribers
    const { data: subscribers, error: subError } = await adminClient
      .from("newsletter_subscribers")
      .select("email")
      .eq("subscribed", true);

    if (subError) throw subError;

    const totalSent = subscribers?.length ?? 0;

    // Send emails via Resend (if API key is configured)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && subscribers && subscribers.length > 0) {
      const siteUrl = Deno.env.get("SITE_URL") ?? "https://vittare.mx";
      const postUrl = `${siteUrl}/blog/${post.slug}`;

      for (const subscriber of subscribers) {
        const coverImageHtml = post.cover_image_url
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;"><tr><td><img src="${post.cover_image_url}" alt="" width="520" style="display:block;border-radius:8px;max-width:100%;height:auto;" /></td></tr></table>`
          : ''

        const htmlBody = buildEmail(
          `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#1F4D2E;font-weight:normal;margin:0 0 20px 0;">${post.title}</h1>` +
          coverImageHtml +
          (post.excerpt ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#1F2937;margin:0 0 24px 0;">${post.excerpt}</p>` : '') +
          `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background-color:#12A357;"><a href="${postUrl}" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px;">Leer artículo completo</a></td></tr></table>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid #E5E7EB;font-size:0;line-height:0;">&nbsp;</td></tr></table>` +
          `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B7280;margin:0;">Recibiste este correo porque estás suscrito al newsletter de Vittare. <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color:#9CA3AF;">Cancelar suscripción</a></p>`,
          post.excerpt || post.title
        )

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Vittare <hola@vittare.mx>",
            to: subscriber.email,
            subject: post.title,
            html: htmlBody,
          }),
        });
      }
    }

    // Update post with sent info
    await adminClient
      .from("blog_posts")
      .update({
        newsletter_sent_at: new Date().toISOString(),
        newsletter_recipients: totalSent,
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({ success: true, total_sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-newsletter error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
