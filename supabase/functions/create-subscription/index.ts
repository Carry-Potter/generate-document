// supabase/functions/create-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.18.0";
import { subscriptionPlans } from "../_shared/plans.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Environment variables:", {
  stripeKey: Deno.env.has("STRIPE_SECRET_KEY") ? "postoji" : "ne postoji",
  supabaseUrl: Deno.env.has("SUPABASE_URL") ? "postoji" : "ne postoji",
  supabaseAnonKey: Deno.env.has("SUPABASE_ANON_KEY") ? "postoji" : "ne postoji"
});

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
    const { planId } = requestBody;
    
    console.log("Tražim plan sa ID-om:", planId);
    
    // Dobavljanje detalja plana iz baze
    const { data: planData, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*, stripe_price_id')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error("Greška pri dobavljanju plana:", planError);
      return new Response(
        JSON.stringify({ error: `Greška pri dobavljanju plana: ${planError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!planData) {
      console.error(`Plan sa ID ${planId} nije pronađen.`);
      return new Response(
        JSON.stringify({ error: `Plan ${planId} nije pronađen` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!planData.stripe_price_id) {
      console.error(`Plan ${planId} nema definisan Stripe Price ID.`);
      return new Response(
        JSON.stringify({ 
          error: `Plan nije dostupan za kupovinu. Kontaktirajte administratora.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Provera da li ID planovi u kodu odgovaraju onima u bazi
    if (planData.price !== planData.price.toString() || 
        planData.documents_limit !== Number(planData.documents_limit)) {
      console.warn(`Plan ${planId} ima neusklađene podatke između koda i baze.`);
    }
    
    // Dobavljanje ili kreiranje Stripe korisnika
    let stripeCustomerId;
    
    // Provera da li korisnik već ima Stripe ID
    const { data: profileData, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Greška pri dobavljanju profila:", profileError);
      return new Response(
        JSON.stringify({ error: `Greška pri dobavljanju profila: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (profileData?.stripe_customer_id) {
      stripeCustomerId = profileData.stripe_customer_id;
    } else {
      // Kreiranje novog Stripe korisnika
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
        metadata: {
          supabase_id: user.id,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Čuvanje Stripe ID-a u bazi
      await supabaseClient
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customer.id,
        });
    }
    
    console.log("Kreiranje Stripe sesije sa podacima:", {
      userId: user.id,
      planId,
      planDetails: planData,
      stripe_customer_id: stripeCustomerId
    });
    
    // Kreiranje Stripe checkout sesije
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: planData.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${siteUrl}${siteUrl.endsWith('/') ? '' : '/'}payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${siteUrl.endsWith('/') ? '' : '/'}pricing`,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });
    
    console.log("Found subscription plan:", planData);
    console.log("Created Stripe session:", session.id);
    console.log("Stripe session URL:", session.url);
    
    // Vraćanje URL-a za redirekciju
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