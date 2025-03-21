// supabase/functions/verify-payment/index.ts
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.6.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Definišemo tip za transakciju
interface TransactionData {
  user_id: string;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'subscription' | 'credit_purchase' | 'document_purchase'; // Dodajemo type u interface
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid request body');
    }

    const { sessionId } = body;
    if (!sessionId?.startsWith('cs_')) {
      throw new Error('Invalid session ID');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) {
    return new Response('Nedostaje token', { status: 401 });
  }

  const { error } = await supabase.auth.getUser(token);
  if (error) {
    return new Response('Nevalidan token', { status: 403 });
  }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Neautorizovan pristup' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price.product']
    });

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Plaćanje nije uspešno' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicijalizujemo transactionData sa svim obaveznim poljima
    const transactionData: TransactionData = {
      user_id: user.id,
      stripe_session_id: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() || 'RSD',
      status: 'completed',
      type: 'credit_purchase' // Default vrednost, biće overwritten u switchu
    };

    let paymentDetails = {};
    const metadata = session.metadata || {};

    switch (session.mode) {
      case 'subscription':
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('stripe_price_id', subscription.items.data[0].price.id)
          .single();

        if (planError || !plan) {
          return new Response(
            JSON.stringify({ error: 'Nevalidan plan pretplate' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_subscription_id: subscription.id,
            plan_id: plan.id,
            status: 'active',
            current_period_end: new Date(subscription.current_period_end * 1000),
            documents_remaining: plan.documents_limit
          })
          .select()
          .single();

        if (subError) throw subError;

        paymentDetails = {
          type: 'subscription',
          plan_name: plan.name,
          documents_limit: plan.documents_limit,
          interval: plan.interval,
          renewal_date: subData.current_period_end
        };

        transactionData.type = 'subscription';
        break;

      case 'payment':
        if (metadata.type === 'credits') {
          const credits = parseInt(metadata.credits || '0', 10);
          
          const { error: creditError } = await supabase.rpc('increment_credits', {
            user_id: user.id,
            increment: credits
          });

          if (creditError) throw creditError;

          paymentDetails = {
            type: 'credits',
            credits_added: credits,
            total_credits: await getCurrentCredits(user.id)
          };

          transactionData.type = 'credit_purchase';
        } 
        else if (metadata.type === 'document') {
          const { data: docData, error: docError } = await supabase
            .from('purchased_documents')
            .insert({
              user_id: user.id,
              document_type: metadata.document_type,
              pages: parseInt(metadata.pages || '1', 10),
              status: 'generated'
            })
            .select()
            .single();

          if (docError) throw docError;

          paymentDetails = {
            type: 'document',
            document_id: docData.id,
            document_type: docData.document_type
          };

          transactionData.type = 'document_purchase';
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Nepodržan tip plaćanja' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const { error: txError } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (txError) throw txError;

    return new Response(
      JSON.stringify({ 
        success: true,
        payment_details: paymentDetails,
        receipt_url: session.invoice?.invoice_pdf || session.charges?.data[0]?.receipt_url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PAYMENT VERIFICATION ERROR:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Došlo je do greške u obradi plaćanja'
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});

async function getCurrentCredits(userId: string) {
  const { data } = await createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )
    .from('user_profiles')
    .select('credits')
    .eq('user_id', userId)
    .single();

  return data?.credits || 0;
}