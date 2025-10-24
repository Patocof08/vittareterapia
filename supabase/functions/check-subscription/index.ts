import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(
        JSON.stringify({ subscriptions: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    logStep("Active subscriptions found", { count: subscriptions.data.length });

    const toISO = (ts: unknown): string | null => {
      try {
        if (ts === undefined || ts === null) return null;
        let n: number | null = null;
        if (typeof ts === 'number') {
          n = ts;
        } else if (typeof ts === 'string') {
          const parsed = Number(ts);
          n = Number.isFinite(parsed) ? parsed : null;
        }
        if (n === null) return null;
        // Handle seconds vs milliseconds
        const ms = n > 1e12 ? n : n * 1000;
        const d = new Date(ms);
        if (Number.isNaN(d.valueOf())) return null;
        return d.toISOString();
      } catch (_) {
        return null;
      }
    };
    const subscriptionDetails = subscriptions.data.map((sub: Stripe.Subscription) => {
      try {
        const startIso = toISO((sub as any).current_period_start);
        const endIso = toISO((sub as any).current_period_end);
        return {
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_start: startIso,
          current_period_end: endIso,
          psychologist_id: sub.metadata?.psychologist_id || null,
          package_type: (sub.metadata?.package_type as string) || null,
          sessions: Number.parseInt((sub.metadata?.sessions as string) ?? "") || (sub.metadata?.package_type === 'package_8' ? 8 : sub.metadata?.package_type === 'package_4' ? 4 : 0),
          cancel_at_period_end: sub.cancel_at_period_end || false,
        };
      } catch (error) {
        logStep("Error processing subscription", { 
          subscriptionId: sub.id, 
          error: error instanceof Error ? error.message : String(error),
          metadata: sub.metadata 
        });
        // Do not throw; return minimal safe object
        return {
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_start: null,
          current_period_end: null,
          psychologist_id: sub.metadata?.psychologist_id || null,
          package_type: (sub.metadata?.package_type as string) || null,
          sessions: 0,
          cancel_at_period_end: sub.cancel_at_period_end || false,
        };
      }
    });

    return new Response(
      JSON.stringify({ subscriptions: subscriptionDetails }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, subscriptions: [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
