// src/lib/payment/usage.ts
import { supabase } from '../supabase';
import { getUserSubscription, getUserCredits, deductCredit } from './user';

interface ResourceCheckResult {
  canGenerate: boolean;
  resourceType?: 'subscription' | 'credits' | null;
  message?: string;
}

export async function checkAndUseResources(userId: string): Promise<ResourceCheckResult> {
  try {
    // 1. Prvo proveriti pretplatu
    const subscription = await getUserSubscription(userId);
    
    if (subscription && subscription.documents_remaining > 0) {
      // Koristi dokument iz pretplate
      const { error } = await supabase
        .from('subscriptions')
        .update({ documents_remaining: subscription.documents_remaining - 1 })
        .eq('id', subscription.id);
      
      if (error) throw error;
      
      return { 
        canGenerate: true, 
        resourceType: 'subscription' 
      };
    }
    
    // 2. Zatim proveriti kredite
    const credits = await getUserCredits(userId);
    
    if (credits > 0) {
      // Koristi kredit
      const success = await deductCredit(userId);
      
      if (!success) {
        return { 
          canGenerate: false, 
          message: 'Greška prilikom oduzimanja kredita' 
        };
      }
      
      return { 
        canGenerate: true, 
        resourceType: 'credits' 
      };
    }
    
    // Nema dostupnih resursa
    return { 
      canGenerate: false, 
      message: 'Nemate dovoljno kredita ili aktivnu pretplatu' 
    };
  } catch (error) {
    console.error('Error checking resources:', error);
    return { 
      canGenerate: false, 
      message: 'Greška prilikom provere resursa' 
    };
  }
}