// src/lib/payment/user.ts
import { supabase } from '../supabase';
import { UserSubscription } from './types';

// Funkcija za dobijanje korisničke pretplate
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Nema aktivne pretplate
        return null;
      }
      throw error;
    }
    
    return data as UserSubscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

// Funkcija za dobijanje korisničkih kredita
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Nema kredita
        return 0;
      }
      throw error;
    }
    
    return data.credits;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }
}

// Funkcija za oduzimanje jednog kredita
export async function deductCredit(userId: string): Promise<boolean> {
  try {
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!userCredits || userCredits.credits <= 0) {
      return false;
    }
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits: userCredits.credits - 1,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error deducting credit from user:', error);
    return false;
  }
}

// Funkcija za ažuriranje preostalih dokumenata u pretplati
export async function updateSubscriptionDocumentsRemaining(
  subscriptionId: string, 
  documentsRemaining: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ documents_remaining: documentsRemaining })
      .eq('id', subscriptionId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating subscription documents remaining:', error);
    return false;
  }
}

// Funkcija za dodavanje kredita korisniku
export async function addCreditsToUser(userId: string, credits: number): Promise<boolean> {
  try {
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    
    if (userCredits) {
      const { error } = await supabase
        .from('user_credits')
        .update({
          credits: userCredits.credits + credits,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: credits,
          last_updated: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding credits to user:', error);
    return false;
  }
}