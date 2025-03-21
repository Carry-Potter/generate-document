import { supabase } from '../supabase';
import { PaymentDetails } from './types';
import toast from 'react-hot-toast';

/**
 * Kreira Stripe checkout sesiju za pretplatu
 * @param planId ID plana pretplate
 * @returns Stripe session ID ili null u slučaju greške
 */
export async function createSubscriptionCheckout(planId: string): Promise<string | null> {
  try {
    console.log(`Pokretanje checkout-a za pretplatu, planId: ${planId}`);
    
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { planId }
    });

    if (error) {
      console.error("Error od Supabase funkcije:", error);
      console.error("Greška pri kreiranju pretplate:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast.error("Greška pri kreiranju pretplate");
      throw error;
    }

    if (data?.sessionId) {
      console.log("Dobijen URL za redirekciju:", data.sessionId);
      // Redirect to Stripe checkout
      window.location.href = data.sessionId;
      return data.sessionId;
    } else {
      console.error("No session ID returned:", data);
      toast.error("Greška: Nije dobijen ID sesije");
      return null;
    }
  } catch (error) {
    console.error('Greška prilikom kreiranja pretplate:', error);
    toast.error('Došlo je do greške prilikom kreiranja pretplate.');
    return null;
  }
}

/**
 * Kreira Stripe checkout sesiju za kupovinu kredita
 * @param packageId ID paketa kredita
 * @returns Stripe session ID ili null u slučaju greške
 */
export async function purchaseCredits(packageId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-credit-package-checkout', {
      body: { packageId }
    });

    if (error) {
      console.error("Greška pri kupovini kredita:", error);
      toast.error("Greška pri kupovini kredita");
      throw error;
    }

    return data.sessionId;
  } catch (error) {
    console.error('Greška prilikom kupovine kredita:', error);
    toast.error('Došlo je do greške prilikom kupovine kredita.');
    return null;
  }
}

/**
 * Verifikuje plaćanje koristeći Stripe session ID
 * @param sessionId Stripe session ID koji se dobija iz URL-a
 * @returns Object sa detaljima plaćanja ili null u slučaju greške
 */
export async function verifyPayment(sessionId: string): Promise<PaymentDetails | null> {
  if (!sessionId) {
    toast.error('Nedostaje ID sesije');
    return null;
  }

  console.log("Početak verifikacije plaćanja sa sessionId:", sessionId);
  
  try {
    // Provera da li je korisnik prijavljen
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Trenutni korisnik:", user ? `ID: ${user.id}` : "Nije prijavljen");
    
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { sessionId }
    });

    if (error) {
      console.error("Greška pri verifikaciji:", error);
      toast.error("Greška pri verifikaciji plaćanja");
      throw error;
    }
    
    console.log("Verifikacija uspešna:", data);
    
    // Prikazivanje poruke o uspešnoj kupovini
    if (data.details?.type === 'subscription') {
      toast.success(`Uspešno ste aktivirali ${data.details.planName} pretplatu!`);
    } else if (data.details?.type === 'credits') {
      toast.success(`Uspešno ste kupili ${data.details.credits} kredita!`);
    } else {
      toast.success('Kupovina uspešna!');
    }
    
    return data.details;
  } catch (error) {
    console.error('Greška prilikom verifikacije plaćanja:', error);
    toast.error('Došlo je do greške prilikom verifikacije plaćanja.');
    return null;
  }
}

/**
 * Proverava da li je plaćanje u toku
 * @param sessionId Stripe session ID koji se proverava
 */
export async function checkPaymentStatus(sessionId: string): Promise<'success' | 'pending' | 'failed'> {
  if (!sessionId) return 'failed';
  
  try {
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { sessionId }
    });
    
    if (error) throw error;
    
    return data.status;
  } catch (error) {
    console.error('Greška prilikom provere statusa plaćanja:', error);
    return 'failed';
  }
}

/**
 * Formatira datum isteka pretplate za prikaz
 * @param dateString ISO string datuma isteka pretplate
 */
export function formatExpiryDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch  {
    return '';
  }
}

/**
 * Vraća tip plaćanja na osnovu session ID-a (za mock podatke u dev modu)
 */
export function getPaymentTypeFromSessionId(sessionId: string): 'subscription' | 'credits' | 'document' {
  if (sessionId.includes('sub')) return 'subscription';
  if (sessionId.includes('credit')) return 'credits';
  return 'document';
}

/**
 * Verifikuje plaćanje koristeći alternativni pristup
 * @param sessionId Stripe session ID koji se dobija iz URL-a
 * @returns boolean da li je verifikacija uspešna
 */
export async function verifyPaymentAlternative(sessionId: string): Promise<boolean> {
  try {
    // Prvo proveravamo da li već postoji transakcija u bazi
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .limit(1);
    
    if (transactions && transactions.length > 0) {
      console.log("Transakcija već postoji u bazi:", transactions[0]);
      
      // Prikazivanje poruke o uspešnoj kupovini
      if (transactions[0].type === 'subscription') {
        toast.success('Uspešno ste aktivirali pretplatu!');
      } else if (transactions[0].type === 'credit_purchase') {
        toast.success('Uspešno ste kupili kredite!');
      } else {
        toast.success('Kupovina uspešna!');
      }
      
      return true;
    }
    
    // Ako ne postoji, pokušavamo verifikaciju kroz funkciju
    return await verifyPayment(sessionId) !== null;
  } catch (error) {
    console.error('Greška prilikom alternativne verifikacije:', error);
    return false;
  }
}
