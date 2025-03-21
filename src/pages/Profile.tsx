import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

type ProfileFormData = {
  fullName: string;
  company: string;
  address: string;
  phone: string;
  pib: string;
  maticzniBroj: string;
};

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [emailDisplay, setEmailDisplay] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      // 1. Dohvati trenutnog korisnika
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Korisnik nije prijavljen');

      console.log('Current user:', user);

      // 2. Dohvati profil korisnika
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // Ako profil ne postoji, kreiraj ga
        if (profileError.code === 'PGRST116') {
          const {  error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                full_name: '',
                address: '',
                phone: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
        
        } else {
          throw profileError;
        }
      }

      console.log('Loaded profile:', profile);

      // 3. Popuni formu sa podacima
      reset({
        fullName: profile?.full_name || '',
        company: profile?.company || '',
        address: profile?.address || '',
        phone: profile?.phone || '',
        pib: profile?.pib || '',
        maticzniBroj: profile?.maticni_broj || ''
      });

      // Postavi email odvojeno (samo za prikaz)
      setEmailDisplay(user.email || '');

    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      setMessage('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Korisnik nije prijavljen');

      // Ažuriraj profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          company: data.company,
          address: data.address,
          phone: data.phone,
          pib: data.pib,
          maticni_broj: data.maticzniBroj,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setMessage('Profil je uspešno ažuriran');
    } 
    finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profil korisnika</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={emailDisplay}
              disabled
              className="w-full p-2 border rounded bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ime i prezime *</label>
            <input
              type="text"
              {...register('fullName', { required: 'Ime je obavezno' })}
              className="w-full p-2 border rounded"
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm">{errors.fullName.message}</p>
            )}
          </div>

        

          <div>
            <label className="block text-sm font-medium mb-1">Adresa *</label>
            <input
              type="text"
              {...register('address', { required: 'Adresa je obavezna' })}
              className="w-full p-2 border rounded"
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefon *</label>
            <input
              type="tel"
              {...register('phone', { required: 'Telefon je obavezan' })}
              className="w-full p-2 border rounded"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

         

          
        </div>

        {message && (
          <p className={`text-sm ${message.includes('Greška') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              'Sačuvaj promene'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}