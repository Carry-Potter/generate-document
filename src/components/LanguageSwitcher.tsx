// src/components/LanguageSwitcher.tsx
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18nInstance from '../i18n/i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  // Provera trenutnog jezika
  const currentLanguage = i18n.language || localStorage.getItem('i18nextLng') || 'sr';
  
  // Optimizovana funkcija za promenu jezika
  const changeLanguage = useCallback(async (lng: string) => {
    try {
      // Postavljanje jezika u localStorage
      localStorage.setItem('i18nextLng', lng);
      
      // Promena jezika
      await i18n.changeLanguage(lng);
      
      // Provera da li je jezik zaista promenjen
      if (i18n.language !== lng) {
        console.warn(`Language change to ${lng} might not have completed properly. Current: ${i18n.language}`);
      }
      
      // Ako prethodna promena nije uspela, pokušaj direktno preko instance
      if (i18n.language !== lng && i18nInstance && typeof i18nInstance.changeLanguage === 'function') {
        await i18nInstance.changeLanguage(lng);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, [i18n]);
  
  // Provera da li je jezik srpski
  const isSerbian = currentLanguage === 'sr' || currentLanguage.startsWith('sr');
  
  // Provera da li je jezik engleski
  const isEnglish = currentLanguage === 'en' || currentLanguage.startsWith('en');
  
  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => changeLanguage('sr')}
        className={`px-2 py-1 rounded ${
          isSerbian ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
        aria-label="Switch to Serbian"
      >
        SR
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded ${
          isEnglish ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}