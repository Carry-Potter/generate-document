import React from 'react';
import { FileText, LogOut, User, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

import { useUser } from '../context/UserContext';



export default function Navbar() {
  const { user, credits } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  console.log("User u Navbar-u:", user);
  console.log("Krediti u Navbar-u:", credits);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                {t('appName')}
              </span>
            </Link>
            
            <nav className="ml-6 flex space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {t('nav.pricing')}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            <LanguageSwitcher />
            
            {!user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
            
            {user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <User className="h-4 w-4 mr-1" />
                  {t('nav.profile')}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="inline-flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('nav.signOut')}
                </Button>
              </div>
            )}
            
            {user && (
              <div className="ml-4 flex items-center">
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-800 text-sm font-medium">
                  {credits} kredita
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}