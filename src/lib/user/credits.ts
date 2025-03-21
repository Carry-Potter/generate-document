import { supabase } from '../supabase';

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
    
    return data.credits || 0;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }
}

// Funkcija za umanjenje kredita
export async function decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
  try {
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return false; // Korisnik nema kredita
      }
      throw fetchError;
    }
    
    // Provera da li korisnik ima dovoljno kredita
    if (userCredits.credits < amount) {
      return false;
    }
    
    // Umanjenje kredita
    const { error } = await supabase
      .from('user_credits')
      .update({
        credits: userCredits.credits - amount,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error decrementing user credits:', error);
    return false;
  }
}

// Funkcija za dodavanje kredita
export async function addUserCredits(userId: string, amount: number): Promise<boolean> {
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
          credits: userCredits.credits + amount,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: amount,
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

// Funkcija za osvežavanje broja kredita u sesiji
export async function refreshUserCredits(userId: string) {
  const credits = await getUserCredits(userId);
  
  // Ažuriranje session-a sa novim brojem kredita
  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    // Ako koristimo metapodatke za čuvanje kredita
    await supabase.auth.updateUser({
      data: { credits }
    });
  }
  
  return credits;
}
