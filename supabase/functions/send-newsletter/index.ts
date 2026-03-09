import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      .select("email, nombre")
      .eq("status", "active");

    if (subError) throw subError;

    const totalSent = subscribers?.length ?? 0;

    // Send emails via Resend (if API key is configured)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && subscribers && subscribers.length > 0) {
      const siteUrl = Deno.env.get("SITE_URL") ?? "https://vittareterapia.com";
      const postUrl = `${siteUrl}/blog/${post.slug}`;

      for (const subscriber of subscribers) {
        const nombre = subscriber.nombre || "Hola";
        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">${post.title}</h2>
            ${post.excerpt ? `<p style="color: #555;">${post.excerpt}</p>` : ""}
            ${post.cover_image_url ? `<img src="${post.cover_image_url}" alt="" style="width:100%;border-radius:8px;margin:16px 0;" />` : ""}
            <p>
              <a href="${postUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Leer artículo completo
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#999;font-size:12px;">
              Recibiste este correo porque estás suscrito al newsletter de Vittare.<br/>
              <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color:#999;">Cancelar suscripción</a>
            </p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Vittare <newsletter@vittareterapia.com>",
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
