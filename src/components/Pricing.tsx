// src/components/Pricing.tsx
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { createSubscriptionCheckout, purchaseCredits } from '../lib/payment/verification';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  documentsLimit: number | string;
  description: string;
  features?: string[];
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
}

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    async function loadPlans() {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price'); // Sortiranje po ceni
      
      if (data && !error) {
        setPlans(data.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: parseFloat(plan.price),
          interval: plan.interval,
          documentsLimit: plan.documents_limit,
          description: plan.description || '',
          features: [
            `${plan.documents_limit} dokumenata mesečno`,
            'Pristup svim tipovima dokumenata',
            'Podrška putem email-a'
          ]
        })));
      }
    }
    
    loadPlans();
  }, []);

  // Primer paketa kredita
  const creditPackages: CreditPackage[] = [
    {
      id: 'small-pack',
      name: 'Mali paket',
      credits: 5,
      price: 4.99,
      features: [
        '5 dokumenata',
        'Bez vremenskog ograničenja',
        'Pristup svim tipovima dokumenata'
      ]
    },
    {
      id: 'medium-pack',
      name: 'Srednji paket',
      credits: 20,
      price: 16.99,
      features: [
        '20 dokumenata',
        'Bez vremenskog ograničenja',
        'Pristup svim tipovima dokumenata',
        'Popust od 15%'
      ]
    },
    {
      id: 'large-pack',
      name: 'Veliki paket',
      credits: 50,
      price: 34.99,
      features: [
        '50 dokumenata',
        'Bez vremenskog ograničenja',
        'Pristup svim tipovima dokumenata',
        'Popust od 30%'
      ]
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Morate biti prijavljeni da biste se pretplatili');
      return;
    }

    try {
      setLoading(planId);
      
      // Dodajte log za debugging
      console.log(`Pokretanje pretplate na plan: ${planId}`);
      
      await createSubscriptionCheckout(planId);
      // Redirekcija će se dogoditi automatski u createSubscriptionCheckout
    } catch (error) {
      console.error('Greška pri kreiranju pretplate:', error);
      toast.error('Došlo je do greške pri kreiranju pretplate. Pokušajte ponovo kasnije.');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async (packageId: string) => {
    if (!user) {
      toast.error('Morate biti prijavljeni da biste kupili kredite');
      return;
    }

    try {
      setLoading(packageId);
      await purchaseCredits(packageId);
      // Redirekcija na Stripe checkout će se dogoditi automatski
    } catch (error) {
      console.error('Greška pri kupovini kredita:', error);
      toast.error('Došlo je do greške pri kupovini kredita');
      setLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Izaberite plan koji vam odgovara
        </h2>
        <p className="mt-4 text-xl text-gray-600">
          Možete se pretplatiti na mesečni plan ili kupiti pakete kredita prema potrebi
        </p>
      </div>

      {/* Planovi pretplate */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Mesečne pretplate</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">€{plan.price}</span>
                  <span className="ml-1 text-xl text-gray-500">/{plan.interval}</span>
                </div>
                <p className="mt-2 text-gray-600">{plan.documentsLimit} dokumenata mesečno</p>
              </div>
              <div className="px-6 py-4 bg-gray-50">
                {plan.features ? (
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                        <span className="ml-2 text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                      <span className="ml-2 text-gray-700">{plan.documentsLimit} dokumenata mesečno</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                      <span className="ml-2 text-gray-700">Pristup svim tipovima dokumenata</span>
                    </li>
                  </ul>
                )}
              </div>
              <div className="px-6 py-4">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-blue-400"
                >
                  {loading === plan.id ? 'Obrada...' : 'Pretplati se'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paketi kredita */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Paketi kredita</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {creditPackages.map((pack) => (
            <div 
              key={pack.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-semibold text-gray-900">{pack.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">€{pack.price}</span>
                </div>
                <p className="mt-2 text-gray-600">{pack.credits} kredita</p>
              </div>
              <div className="px-6 py-4 bg-gray-50">
                <ul className="space-y-3">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500">✓</span>
                      <span className="ml-2 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 py-4">
                <button
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={loading === pack.id}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:bg-green-400"
                >
                  {loading === pack.id ? 'Obrada...' : 'Kupi kredite'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}