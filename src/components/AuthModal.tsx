import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Loader2, X } from 'lucide-react';

type FormData = {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
 
  address?: string;
  phone?: string;

};

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>();

  const handleLogin = async (data: FormData) => {
    try {
      setIsLoading(true);
      setMessage('');

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      onClose();
      reset();
    } catch (error: any) {
      setMessage(error.message || 'Greška prilikom prijave');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: FormData) => {
    try {
      setIsLoading(true);
      setMessage('');

      // 1. Registracija korisnika
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password!,
        options: {
          data: {
            full_name: data.fullName,
            
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // 2. Kreiranje profila
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: data.fullName,
              
              address: data.address,
              phone: data.phone,
             
            }
          ]);

        if (profileError) throw profileError;
      }

      setMessage('Proverite email za verifikaciju naloga');
      reset();
    } catch (error: any) {
      setMessage(error.message || 'Greška prilikom registracije');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {mode === 'login' ? 'Prijava' : 'Registracija'}
        </h2>

        <form onSubmit={handleSubmit(mode === 'login' ? handleLogin : handleRegister)} 
              className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email je obavezan',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Unesite validan email'
                }
              })}
              className="w-full p-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {mode === 'register' && (
            <>
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

             
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Lozinka *</label>
            <input
              type="password"
              {...register('password', { 
                required: 'Lozinka je obavezna',
                minLength: {
                  value: 6,
                  message: 'Lozinka mora imati najmanje 6 karaktera'
                }
              })}
              className="w-full p-2 border rounded"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1">Potvrda lozinke *</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  validate: value => value === watch('password') || 'Lozinke se ne poklapaju'
                })}
                className="w-full p-2 border rounded"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {message && (
            <p className={`text-sm ${message.includes('Greška') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : mode === 'login' ? (
              'Prijavi se'
            ) : (
              'Registruj se'
            )}
          </button>

          <p className="text-center text-sm">
            {mode === 'login' ? (
              <>
                Nemate nalog?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:underline"
                >
                  Registrujte se
                </button>
              </>
            ) : (
              <>
                Već imate nalog?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:underline"
                >
                  Prijavite se
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}