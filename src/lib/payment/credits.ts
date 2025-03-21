// src/lib/payment/credits.ts
import { supabase } from '../supabase';
import { ResourceCheckResult, UserSubscription } from './types';

export const canUserGenerateDocument = async (): Promise<ResourceCheckResult> => {
  try {
    // Prvo proveriti aktivne pretplate
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .gt('documents_remaining', 0);
    
    if (subscriptions && subscriptions.length > 0) {
      return { 
        canGenerate: true, 
        subscription: subscriptions[0] as UserSubscription
      };
    }
    
    // Ako nema aktivne pretplate, proveriti kredite
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('credits')
      .single();
    
    if (userCredits && userCredits.credits > 0) {
      return { 
        canGenerate: true, 
        credits: userCredits.credits 
      };
    }
    
    return { 
      canGenerate: false, 
      reason: 'no-credits', 
      credits: userCredits?.credits || 0 
    };
  } catch (error) {
    console.error('Greška prilikom provere mogućnosti generisanja:', error);
    return { canGenerate: false, reason: 'error' };
  }
};

export const decrementCreditsOrSubscription = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Prvo proveriti pretplate
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .gt('documents_remaining', 0)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (subscriptions && subscriptions.length > 0) {
      // Koristimo pretplatu
      const subscription = subscriptions[0];
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          documents_remaining: subscription.documents_remaining - 1 
        })
        .eq('id', subscription.id);
      
      return !error;
    }
    
    // Ako nema pretplate, koristimo kredite
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (userCredits && userCredits.credits > 0) {
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          credits: userCredits.credits - 1 
        })
        .eq('user_id', user.id);
      
      return !error;
    }
    
    return false;
  } catch (error) {
    console.error('Greška prilikom smanjenja resursa:', error);
    return false;
  }
};