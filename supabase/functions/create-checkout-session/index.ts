import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role for database operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[CREATE-CHECKOUT] Function started");
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("Usuario no autenticado");
    }

    console.log("[CREATE-CHECKOUT] User authenticated:", user.id);

    const { 
      psychologist_id, 
      payment_type, 
      appointment_id 
    } = await req.json();

    if (!psychologist_id || !payment_type) {
      throw new Error("Faltan parámetros requeridos");
    }

    console.log("[CREATE-CHECKOUT] Parameters:", { psychologist_id, payment_type, appointment_id });

    // Obtener pricing del psicólogo
    const { data: pricing, error: pricingError } = await supabaseClient
      .from("psychologist_pricing")
      .select("*, psychologist_profiles!inner(first_name, last_name)")
      .eq("psychologist_id", psychologist_id)
      .single();

    if (pricingError || !pricing) {
      throw new Error("No se encontró información de precios del psicólogo");
    }

    console.log("[CREATE-CHECKOUT] Pricing loaded");

    // Calcular precio según tipo de pago
    let amount = 0;
    let description = "";
    let productName = "";

    if (payment_type === "single_session") {
      amount = Number(pricing.session_price);
      productName = `Sesión Individual - Dr. ${pricing.psychologist_profiles.first_name} ${pricing.psychologist_profiles.last_name}`;
      description = "Sesión individual de 50 minutos";
    } else if (payment_type === "package_4") {
      amount = Number(pricing.package_4_price);
      productName = `Paquete 4 Sesiones - Dr. ${pricing.psychologist_profiles.first_name} ${pricing.psychologist_profiles.last_name}`;
      description = "Paquete de 4 sesiones con descuento";
    } else if (payment_type === "package_8") {
      amount = Number(pricing.package_8_price);
      productName = `Paquete 8 Sesiones - Dr. ${pricing.psychologist_profiles.first_name} ${pricing.psychologist_profiles.last_name}`;
      description = "Paquete de 8 sesiones con descuento";
    } else {
      throw new Error("Tipo de pago no válido");
    }

    console.log("[CREATE-CHECKOUT] Amount calculated:", amount);

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Buscar o crear customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Existing customer found:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("[CREATE-CHECKOUT] New customer created:", customerId);
    }

    // Crear payment record en pending
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        client_id: user.id,
        psychologist_id: psychologist_id,
        appointment_id: appointment_id || null,
        amount: amount,
        currency: "MXN",
        payment_type: payment_type,
        payment_status: "pending",
        description: description,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[CREATE-CHECKOUT] Payment insert error:", paymentError);
      throw new Error("Error al crear registro de pago");
    }

    console.log("[CREATE-CHECKOUT] Payment record created:", payment.id);

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: Math.round(amount * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/portal/checkout?payment_id=${payment.id}&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/portal/agendar?canceled=true`,
      metadata: {
        payment_id: payment.id,
        psychologist_id: psychologist_id,
        appointment_id: appointment_id || "",
        payment_type: payment_type,
        amount: amount.toString(),
      },
    });

    console.log("[CREATE-CHECKOUT] Checkout session created:", session.id);

    // Actualizar payment con session_id
    await supabaseClient
      .from("payments")
      .update({ 
        transaction_reference: session.id 
      })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        payment_id: payment.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
