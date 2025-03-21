// src/components/DocumentGenerator.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { canUserGenerateDocument, decrementCreditsOrSubscription } from '../lib/payment/credits';
import { useUser } from '../context/UserContext'; // Prilagodite prema vašem auth sistemu
import toast from 'react-hot-toast'; // Ili koji god sistem notifikacija koristite
import { UserSubscription } from '../lib/payment/types';

interface FormData {
  title: string;
  documentType: string;
  content: string;
  additionalInfo: string;
}

interface GeneratedDocument {
  title: string;
  content: string;
  documentId?: string;
}

interface ResourceInfo {
  canGenerate: boolean;
  subscription?: UserSubscription;
  credits?: number;
  reason?: string;
}

export default function DocumentGenerator() {
  const { user, credits, refreshCredits } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resourceChecking, setResourceChecking] = useState(true);
  const [resourceInfo, setResourceInfo] = useState<ResourceInfo>({ canGenerate: false });
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    documentType: 'ugovor',
    content: '',
    additionalInfo: ''
  });
  
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  // Provera resursa pri učitavanju komponente
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    checkResources();
  }, [user, navigate]);

  // Dodajte useEffect za osvežavanje kredita pri učitavanju
  useEffect(() => {
    if (user) {
      refreshCredits();
    }
  }, [user]);

  const checkResources = async () => {
    try {
      setResourceChecking(true);
      const resources = await canUserGenerateDocument();
      setResourceInfo(resources);
    } catch (error) {
      console.error('Greška pri proveri resursa:', error);
      toast.error('Nije moguće proveriti dostupne resurse');
    } finally {
      setResourceChecking(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Morate biti prijavljeni za generisanje dokumenta');
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      
      // Ponovna provera resursa neposredno pre generisanja
      const resources = await canUserGenerateDocument();
      
      if (!resources.canGenerate) {
        toast.error('Nemate dovoljno resursa za generisanje dokumenta');
        navigate('/pricing');
        return;
      }
      
      // Generisanje dokumenta
      const result = await generateDocument(formData);
      
      // Smanjenje kredita ili broja dostupnih dokumenata u pretplati
      const decrementSuccess = await decrementCreditsOrSubscription();
      
      if (!decrementSuccess) {
        toast.error('Greška pri umanjenju resursa');
        return;
      }
      
      // Čuvanje dokumenta u bazi
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: formData.title,
          document_type: formData.documentType,
          content: result.content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setGeneratedDocument({
        title: formData.title,
        content: result.content,
        documentId: data.id
      });
      
      toast.success('Dokument je uspešno generisan!');
      
      // Osvežavanje stanja resursa
      checkResources();
      
    } catch (error) {
      console.error('Greška pri generisanju dokumenta:', error);
      toast.error('Došlo je do greške pri generisanju dokumenta');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedDocument(null);
    setFormData({
      title: '',
      documentType: 'ugovor',
      content: '',
      additionalInfo: ''
    });
  };

  const handleDownload = () => {
    if (!generatedDocument) return;
    
    // Implementacija preuzimanja dokumenta
    const element = document.createElement('a');
    const file = new Blob([generatedDocument.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${generatedDocument.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Funkcija za generisanje dokumenta - zamenite sa pozivom vašeg API-ja
  const generateDocument = async (data: FormData): Promise<{content: string}> => {
    // Ovo je samo simulacija - zamenite sa stvarnim pozivom API-ja
    return new Promise<{content: string}>((resolve) => {
      setTimeout(() => {
        resolve({
          content: `Ovo je generisani ${data.documentType} sa naslovom "${data.title}"\n\n${data.content}\n\nDodatne informacije: ${data.additionalInfo}`
        });
      }, 2000);
    });
  };

  if (resourceChecking) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p>Proveravanje dostupnih resursa...</p>
      </div>
    );
  }

  if (!resourceInfo.canGenerate) {
    return (
      <div className="text-center py-8 max-w-lg mx-auto">
        <h3 className="text-xl font-semibold mb-4">Nemate dovoljno resursa za generisanje dokumenta</h3>
        <p className="mb-6">
          Za generisanje dokumenta potrebno je da imate aktivnu pretplatu ili dovoljno kredita.
        </p>
        <button
          onClick={() => navigate('/pricing')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Kupi kredite ili pretplatu
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generator dokumenata</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-blue-800">Dostupni krediti</p>
          <p className="text-2xl font-bold text-blue-600">{credits}</p>
        </div>
        
        {credits < 1 && (
          <button 
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Kupi kredite
          </button>
        )}
      </div>

      {!generatedDocument ? (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Generator dokumenata</h2>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Naslov dokumenta
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Unesite naslov dokumenta"
            />
          </div>
          
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
              Tip dokumenta
            </label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ugovor">Ugovor</option>
              <option value="izjava">Izjava</option>
              <option value="molba">Molba</option>
              <option value="zalba">Žalba</option>
              <option value="punomoćje">Punomoćje</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Opis ili sadržaj
            </label>
            <textarea
              id="content"
              name="content"
              rows={5}
              value={formData.content}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Opišite šta želite da dokument sadrži..."
            />
          </div>
          
          <div>
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Dodatne informacije
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              rows={3}
              value={formData.additionalInfo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Unesite dodatne informacije ako je potrebno..."
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-blue-400"
            >
              {loading ? 'Generisanje u toku...' : 'Generiši dokument'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Generisani dokument</h2>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg">{generatedDocument.title}</h3>
            <div className="mt-4 p-4 border border-gray-200 rounded-md whitespace-pre-wrap">
              {generatedDocument.content}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Novi dokument
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Preuzmi dokument
            </button>
          </div>
        </div>
      )}
    </div>
  );
}