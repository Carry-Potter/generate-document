// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.18.0";
import { creditPackages } from "../_shared/plans.ts";

// Inicijalizacija Stripe-a
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

// Webhook secret
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Webhook function initialized with config:", {
  stripeKey: Deno.env.has("STRIPE_SECRET_KEY") ? "postoji" : "ne postoji",
  webhookSecret: Deno.env.has("STRIPE_WEBHOOK_SECRET") ? "postoji" : "ne postoji",
  supabaseUrl: Deno.env.has("SUPABASE_URL") ? "postoji" : "ne postoji",
});

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Kreiranje Supabase klijenta
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Dobavljanje payload-a
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verifikacija webhook-a
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Obrađivanje različitih tipova događaja
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Uspešna checkout sesija:", session.id);
      
      // Izvlačenje metapodataka
      const userId = session.metadata?.userId;
      const type = session.metadata?.type;
      const packageId = session.metadata?.packageId;
      const planId = session.metadata?.planId;
      
      // Provera da li je plaćanje zaista uspešno
      if (session.payment_status !== "paid") {
        console.log("Sesija nije plaćena, preskačem:", session.id);
        return new Response(
          JSON.stringify({ received: true, status: "pending" }),
          { status: 200 }
        );
      }
      
      try {
        // Dodavanje zapisa o transakciji
        const { error: transactionError } = await supabaseClient
          .from("transactions")
          .insert({
            user_id: userId,
            type: session.mode === "subscription" ? "subscription" : 
                  type === "credits" ? "credit_purchase" : "document_purchase",
            stripe_session_id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            description: `Plaćanje za ${session.mode === "subscription" ? "pretplatu" : 
                          type === "credits" ? "paket kredita" : "dokument"}`,
            status: "completed"
          });
        
        if (transactionError) {
          console.error("Greška pri dodavanju transakcije:", transactionError);
        } else {
          console.log("Transakcija uspešno dodata");
        }
        
        // Dodatna obrada u zavisnosti od tipa plaćanja
        if (type === "credits" && packageId) {
          // Dodavanje kredita korisniku
          // ...
        } else if (session.mode === "subscription" && planId) {
          // Dohvatanje podataka o planu
          const { data: planData } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();
          
          if (planData) {
            // Obrada podataka o pretplati...
          }
        }
        
        return new Response(
          JSON.stringify({ received: true, status: "success" }),
          { status: 200 }
        );
      } catch (error) {
        console.error("Greška pri obradi webhook-a:", error);
        return new Response(
          JSON.stringify({ received: true, status: "error", message: error.message }),
          { status: 200 }
        );
      }
    } else if (event.type === "invoice.payment_succeeded") {
      // Obrada uspešnog plaćanja fakture (obnavljanje pretplate)
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        
        // Pronalaženje pretplate u bazi
        const { data: subscriptionData } = await supabaseClient
          .from("subscriptions")
          .select("*, subscription_plans(*)")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        
        if (subscriptionData) {
          // Obnavljanje pretplate
          await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              documents_remaining: subscriptionData.subscription_plans.documents_limit,
            })
            .eq("id", subscriptionData.id);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      
      // Ažuriranje statusa pretplate u bazi
      await supabaseClient
        .from("subscriptions")
        .update({
          status: "canceled",
        })
        .eq("stripe_subscription_id", subscription.id);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Greška pri obradi webhook-a:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        details: "Pogledajte logove u Supabase konzoli"
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
