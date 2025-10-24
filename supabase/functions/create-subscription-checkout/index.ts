import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { psychologist_id, package_type } = await req.json();
    logStep("Request body", { psychologist_id, package_type });

    if (!psychologist_id || !package_type) {
      throw new Error("Missing required fields: psychologist_id, package_type");
    }

    if (!['package_4', 'package_8'].includes(package_type)) {
      throw new Error("Invalid package_type. Must be 'package_4' or 'package_8'");
    }

    // Get psychologist pricing
    const { data: pricing, error: pricingError } = await supabaseClient
      .from('psychologist_pricing')
      .select('session_price, currency')
      .eq('psychologist_id', psychologist_id)
      .single();

    if (pricingError || !pricing) {
      throw new Error("Psychologist pricing not found");
    }
    logStep("Pricing fetched", pricing);

    // Calculate subscription amount based on package
    const sessions = package_type === 'package_4' ? 4 : 8;
    const discountPercentage = package_type === 'package_4' ? 10 : 20;
    const sessionPrice = parseFloat(pricing.session_price);
    const totalBeforeDiscount = sessionPrice * sessions;
    const discountAmount = totalBeforeDiscount * (discountPercentage / 100);
    const finalAmount = totalBeforeDiscount - discountAmount;
    
    logStep("Calculated amounts", {
      sessions,
      sessionPrice,
      discountPercentage,
      totalBeforeDiscount,
      discountAmount,
      finalAmount
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session with price_data
    const productName = `Suscripción ${sessions} sesiones`;
    const description = `${sessions} sesiones mensuales con ${discountPercentage}% de descuento`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: pricing.currency.toLowerCase(),
            unit_amount: Math.round(finalAmount * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: productName,
              description: description,
              metadata: {
                psychologist_id,
                package_type,
                sessions: sessions.toString(),
                discount_percentage: discountPercentage.toString(),
                session_price: sessionPrice.toString(),
                platform_commission: "15", // 15% platform commission
              },
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/portal/suscripciones?success=true`,
      cancel_url: `${req.headers.get("origin")}/portal/suscripciones?canceled=true`,
      metadata: {
        user_id: user.id,
        psychologist_id,
        package_type,
        sessions: sessions.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
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
