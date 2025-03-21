// src/components/TransactionHistory.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { format } from 'date-fns';
import { Transaction } from '../lib/payment/types';

export default function TransactionHistory() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Greška pri dobavljanju transakcija:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Učitavanje transakcija...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Nemate nijednu transakciju</h2>
        <p className="mt-2">Posetite stranicu sa cenama da biste kupili pretplatu ili kredite.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Istorija transakcija</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Datum</th>
              <th className="py-3 px-4 text-left">Opis</th>
              <th className="py-3 px-4 text-left">Tip</th>
              <th className="py-3 px-4 text-left">Iznos</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  {format(new Date(transaction.created_at), 'dd.MM.yyyy HH:mm')}
                </td>
                <td className="py-3 px-4">{transaction.description}</td>
                <td className="py-3 px-4">
                  {transaction.type === 'subscription' ? 'Pretplata' : 
                   transaction.type === 'credit_purchase' ? 'Kupovina kredita' : 'Kupovina dokumenta'}
                </td>
                <td className="py-3 px-4">{transaction.amount.toFixed(2)} €</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    transaction.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status === 'completed' ? 'Uspešno' : 
                     transaction.status === 'refunded' ? 'Refundirano' : 'Neuspešno'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}