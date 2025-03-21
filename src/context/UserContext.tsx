// src/context/UserContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';
import { getUserCredits } from '../lib/user/credits';

// Definisanje tipa za korisničke dodatne podatke
interface UserMetadata {
  name?: string;
  phone?: string;
  address?: string;
  company?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData?: UserMetadata) => Promise<{ 
    error: AuthError | null; 
    user: User | null 
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  credits: number;
  refreshCredits: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);

  // Osiguraj da se refreshCredits funkcija definiše pre useEffect-a
  const refreshCredits = async () => {
    if (user) {
      try {
        console.log("Osvežavanje kredita za korisnika:", user.id);
        const userCredits = await getUserCredits(user.id);
        console.log("Dobijeni krediti:", userCredits);
        setCredits(userCredits);
      } catch (error) {
        console.error('Greška pri dobavljanju kredita:', error);
      }
    }
  };

  useEffect(() => {
    // Provjera trenutne sesije
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Greška pri dobavljanju korisnika:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Postavi listener za promjene autentikacije
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        refreshCredits();
      } else {
        setUser(null);
        setCredits(0);
      }
      setIsLoading(false);
    });

    checkUser();

    // Očisti listener prilikom unmount-a
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Prijava korisnika
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  // Registracija korisnika
  const signUp = async (email: string, password: string, userData?: UserMetadata) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData
        }
      });
      return { error, user: data.user };
    } catch (error) {
      return { error: error as AuthError, user: null };
    }
  };

  // Odjava korisnika
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Reset lozinke
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    credits,
    refreshCredits,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Hook za korišćenje konteksta
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser mora biti korišćen unutar UserProvider-a');
  }
  return context;
}