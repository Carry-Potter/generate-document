import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  
  useEffect(() => {
    async function verifyPayment() {
      setLoading(true);
      try {
        // Dobijanje session_id iz URL parametara
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        
        console.log("Dobijen session_id:", sessionId);
        
        if (!sessionId) {
          setError('Nedostaje ID sesije.');
          setLoading(false);
          return;
        }
        
        // Pokušaj direktne verifikacije transakcije u bazi
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .limit(1);
        
        console.log("Podaci o transakciji iz baze:", transactionData);
        
        if (transactionData && transactionData.length > 0) {
          // Transakcija već postoji, koristimo te podatke
          setPaymentDetails({
            type: transactionData[0].type,
            planName: transactionData[0].type === 'subscription' ? 'Pretplata' : 'Paket kredita',
            documentsLimit: 0,
            amount: transactionData[0].amount
          });
          setLoading(false);
          return;
        }
        
        // Ako transakcija ne postoji, pozivamo Edge funkciju
        console.log("Pozivamo verify-payment funkciju...");
        const { data, error: functionError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log("Odgovor funkcije:", { data, error: functionError });
        
        if (functionError) {
          console.error('Greška pri verifikaciji plaćanja:', functionError);
          setError(`Došlo je do greške pri verifikaciji plaćanja: ${functionError.message || 'Nepoznata greška'}`);
        } else if (data) {
          setPaymentDetails(data);
        } else {
          setError('Nismo dobili odgovor od servera. Molimo pokušajte ponovo.');
        }
      } catch (err) {
        console.error('Detalji greške:', err);
        setError('Došlo je do neočekivane greške. Molimo vas kontaktirajte podršku.');
      } finally {
        setLoading(false);
      }
    }
    
    verifyPayment();
  }, [location]);
  
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-lg text-gray-600">Verifikujemo vašu uplatu...</p>
          </div>
        ) : error ? (
          <div className="text-red-600">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Došlo je do greške</h2>
            <p className="mt-4 text-lg">{error}</p>
            <div className="mt-8">
              <Link to="/pricing" className="text-indigo-600 hover:text-indigo-500">
                Nazad na pretplate
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">Uplata uspešna!</h2>
            <p className="mt-2 text-xl text-gray-500">
              Hvala vam na vašoj kupovini
            </p>
            
            {paymentDetails && (
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Detalji kupovine</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    {paymentDetails.type === 'subscription' ? (
                      <>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Plan</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{paymentDetails.planName}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Interval</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{paymentDetails.interval}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Broj dokumenata</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{paymentDetails.documentsLimit}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Važi do</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(paymentDetails.currentPeriodEnd).toLocaleDateString()}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Tip dokumenta</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{paymentDetails.documentName}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Cena</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">€{paymentDetails.price}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Idi na dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}