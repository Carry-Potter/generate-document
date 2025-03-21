import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Loader2, X } from 'lucide-react';

type LoginFormData = {
  email: string;
  password: string;
};

type RegisterFormData = {
  email: string;
  password: string;
  fullName: string;
  company?: string;
  address: string;
  phone: string;
  pib?: string;
  maticzniBroj?: string;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  
  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setMessage('');

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setMessage('');

      // 1. Registracija korisnika sa svim podacima u metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            address: data.address,
            phone: data.phone,
            company: data.company,
            pib: data.pib,
            maticni_broj: data.maticzniBroj
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user data after registration');

      console.log('Auth data:', authData);

      // 2. Sačekamo malo da se trigger izvrši
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Proverimo da li je profil kreiran (dodali limit)
      const { data: profiles, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .limit(1);

      if (checkError) {
        console.error('Profile check error:', checkError);
        throw checkError;
      }

      const profile = profiles?.[0];
      if (!profile) {
        throw new Error('Profile was not created');
      }

      console.log('Created profile:', profile);

      setMessage('Registracija uspešna! Proverite email za verifikaciju.');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(
        error.message === 'User already registered'
          ? 'Email adresa je već registrovana.'
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {isLoginMode ? 'Prijava' : 'Registracija'}
        </h2>

        {isLoginMode ? (
          // Login forma
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                {...loginForm.register('email', { required: 'Email je obavezan' })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Lozinka</label>
              <input
                type="password"
                {...loginForm.register('password', { required: 'Lozinka je obavezna' })}
                className="w-full p-2 border rounded"
              />
            </div>

            {message && (
              <p className="text-red-500 text-sm">{message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                'Prijavi se'
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Nemate nalog?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className="text-blue-600 hover:underline"
              >
                Registrujte se
              </button>
            </p>
          </form>
        ) : (
          // Register forma
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                {...registerForm.register('email', { required: 'Email je obavezan' })}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.email && (
                <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ime i prezime * <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...registerForm.register('fullName', { 
                  required: 'Ime i prezime je obavezno',
                  minLength: { value: 2, message: 'Ime mora imati najmanje 2 karaktera' }
                })}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.fullName && (
                <p className="text-red-500 text-sm">{registerForm.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Adresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...registerForm.register('address', { 
                  required: 'Adresa je obavezna' 
                })}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.address && <p className="text-red-500 text-sm">{registerForm.formState.errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...registerForm.register('phone', { 
                  required: 'Telefon je obavezan',
                  pattern: {
                    value: /^[0-9+\-\s()]*$/,
                    message: 'Unesite validan broj telefona'
                  }
                })}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.phone && <p className="text-red-500 text-sm">{registerForm.formState.errors.phone.message}</p>}
            </div>

            {/* Opciona polja */}
            <div>
              <label className="block text-sm font-medium mb-1">Naziv firme</label>
              <input
                type="text"
                {...registerForm.register('company')}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">PIB</label>
              <input
                type="text"
                {...registerForm.register('pib')}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Matični broj</label>
              <input
                type="text"
                {...registerForm.register('maticzniBroj')}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Lozinka *</label>
              <input
                type="password"
                {...registerForm.register('password', { 
                  required: 'Lozinka je obavezna',
                  minLength: { 
                    value: 6, 
                    message: 'Lozinka mora imati najmanje 6 karaktera' 
                  }
                })}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.password && (
                <p className="text-red-500 text-sm">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Potvrda lozinke *</label>
              <input
                type="password"
               
                className="w-full p-2 border rounded"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.includes('Uspešno') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                'Registruj se'
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Već imate nalog?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className="text-blue-600 hover:underline"
              >
                Prijavite se
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}