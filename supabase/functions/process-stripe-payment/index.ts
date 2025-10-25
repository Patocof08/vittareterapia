import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-STRIPE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { payment_id, session_id } = await req.json();
    logStep("Processing payment", { payment_id, session_id });

    if (!payment_id || !session_id) {
      throw new Error("Missing payment_id or session_id");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved Stripe session", { 
      payment_status: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const { 
      appointment_id, 
      psychologist_id, 
      payment_type,
    } = session.metadata;

    if (!appointment_id || !psychologist_id || !payment_type) {
      throw new Error("Missing metadata in Stripe session");
    }

    logStep("Metadata extracted", { appointment_id, psychologist_id, payment_type });

    // Update appointment status
    const { error: apptError } = await supabaseClient
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointment_id);

    if (apptError) {
      logStep("Error updating appointment", apptError);
      throw apptError;
    }

    // Update existing payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .update({
        payment_status: "completed",
        payment_method: "stripe",
        transaction_reference: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq("id", payment_id)
      .select()
      .single();

    if (paymentError) {
      logStep("Error updating payment", paymentError);
      throw paymentError;
    }

    logStep("Payment updated", { payment_id: payment.id });

    // If package, create subscription
    if (payment_type === "package_4" || payment_type === "package_8") {
      const sessionsTotal = payment_type === "package_4" ? 4 : 8;
      const discountPercentage = payment_type === "package_4" ? 10 : 20;
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data: pricing } = await supabaseClient
        .from("psychologist_pricing")
        .select("session_price")
        .eq("psychologist_id", psychologist_id)
        .single();

      const { error: subError } = await supabaseClient
        .from("client_subscriptions")
        .insert({
          client_id: user.id,
          psychologist_id,
          package_type: payment_type,
          sessions_total: sessionsTotal,
          sessions_remaining: sessionsTotal - 1, // -1 because first appointment already booked
          sessions_used: 1, // First session already used
          session_price: pricing ? Number(pricing.session_price) : 0,
          discount_percentage: discountPercentage,
          status: "active",
          auto_renew: false,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_billing_date: null,
        });

      if (subError) {
        logStep("Error creating subscription", subError);
        throw subError;
      }

      logStep("Subscription created successfully");
    }

    // Create invoice
    await supabaseClient.from("invoices").insert({
      payment_id: payment.id,
      client_id: user.id,
      psychologist_id,
      amount: payment.amount,
      currency: payment.currency,
      issued_at: new Date().toISOString(),
    });

    logStep("Invoice created");

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_type,
        message: "Payment processed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
