import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout } from '../_shared/emailLayout.ts'
import { emailH1, emailP, emailButton, emailDivider, emailSmall } from '../_shared/emailComponents.ts'

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
          ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;"><tr><td><img src="${post.cover_image_url}" alt="" width="100%" style="display:block;border-radius:8px;max-width:100%;height:auto;" /></td></tr></table>`
          : ''

        const htmlBody = emailLayout(
          emailH1(post.title) +
          coverImageHtml +
          (post.excerpt ? emailP(post.excerpt) : '') +
          emailButton(postUrl, 'Leer artículo completo') +
          emailDivider() +
          emailSmall(`Recibiste este correo porque estás suscrito al newsletter de Vittare. <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color:#9CA3AF;">Cancelar suscripción</a>`),
          { previewText: post.excerpt || post.title }
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
