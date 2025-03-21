// src/components/UserSubscriptionInfo.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, FileText } from 'lucide-react';
import Button from './Button';
import { createSubscriptionCheckout, createCreditPackageCheckout } from '../lib/payment/stripe';

type UserSubscriptionInfoProps = {
  subscription: any;
  credits: number;
};

export default function UserSubscriptionInfo({ subscription, credits }: UserSubscriptionInfoProps) {
  const { t } = useTranslation();
  
  const handleUpgrade = async () => {
    try {
      window.location.href = '/pricing';
    } catch (error) {
      console.error('Error navigating to pricing:', error);
    }
  };
  
  const handleBuyCredits = async () => {
    try {
      await createCreditPackageCheckout('small');
    } catch (error) {
      console.error('Error buying credits:', error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">{t('profile.subscription.title')}</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-800">
              {t('profile.subscription.yourPlan')}
            </h3>
          </div>
          
          {subscription ? (
            <>
              <p className="text-blue-700 mb-4">
                {subscription.planName}
              </p>
              <Button 
                onClick={handleUpgrade}
                className="w-full"
              >
                {t('profile.subscription.changePlan')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-blue-700 mb-4">
                {t('profile.subscription.noPlan')}
              </p>
              <Button 
                onClick={handleUpgrade}
                className="w-full"
              >
                {t('profile.subscription.subscribe')}
              </Button>
            </>
          )}
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">
              {t('profile.credits.title')}
            </h3>
          </div>
          
          <p className="text-green-700 font-medium text-lg mb-1">
            {credits} {t('profile.credits.available')}
          </p>
          <p className="text-green-600 mb-4">
            {t('profile.credits.description')}
          </p>
          
          <Button 
            variant={credits > 0 ? "outline" : "default"}
            onClick={handleBuyCredits}
            className="w-full"
          >
            {t('profile.credits.buyMore')}
          </Button>
        </div>
      </div>
    </div>
  );
}