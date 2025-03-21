// src/components/PaymentStatus.tsx
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserSubscription, getUserCredits } from '../lib/payment/user';
import { Link } from 'react-router-dom';
import { UserSubscription } from '../lib/payment/types';

export default function PaymentStatus() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const [userSubscription, userCredits] = await Promise.all([
          getUserSubscription(user.id),
          getUserCredits(user.id)
        ]);
        
        setSubscription(userSubscription);
        setCredits(userCredits);
      } catch (error) {
        console.error('Error loading payment status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  if (loading || !user) {
    return <div className="p-4 bg-gray-100 rounded">Učitavanje...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold text-lg">Stanje resursa</h3>
      
      {subscription ? (
        <div className="mt-2">
          <p>Aktivna pretplata: <strong>{subscription.plan_id}</strong></p>
          <p>Preostalo dokumenata: <strong>{subscription.documents_remaining}</strong></p>
          <p>Važi do: <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong></p>
        </div>
      ) : (
        <p className="mt-2">Nemate aktivnu pretplatu</p>
      )}
      
      <div className="mt-4">
        <p>Dostupno kredita: <strong>{credits}</strong></p>
      </div>
      
      {!subscription && credits === 0 && (
        <div className="mt-4">
          <Link to="/pricing" className="text-blue-600 hover:underline">
            Kupite kredit ili aktivirajte pretplatu
          </Link>
        </div>
      )}
    </div>
  );
}