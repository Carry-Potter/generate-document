// supabase/functions/create-document-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.18.0";
import { documentPrices } from "../_shared/plans.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const siteUrl = Deno.env.get("SITE_URL") || "https://generate-document.vercel.app";
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const requestBody = await req.json();
    const { documentType } = requestBody;
    
    // Pronalaženje cene dokumenta
    const document = documentPrices.find(doc => doc.type === documentType);
    
    if (!document) {
      return new Response(
        JSON.stringify({ error: "Invalid document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Kreiranje Stripe checkout sesije
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: document.name,
              description: document.description,
            },
            unit_amount: Math.round(document.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}${siteUrl.endsWith('/') ? '' : '/'}payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${siteUrl.endsWith('/') ? '' : '/'}pricing`,
      metadata: {
        userId: user.id,
        type: "document",
        documentType: documentType,
      },
    });
    
    return new Response(
      JSON.stringify({ sessionId: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Greška pri obradi zahteva:", error);
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