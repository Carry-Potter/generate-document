// src/components/DocumentHistory.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { format } from 'date-fns';
import { Document } from '../lib/payment/types';

export default function DocumentHistory() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Greška pri dobavljanju dokumenata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  if (loading) {
    return <div className="p-4 text-center">Učitavanje...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Nemate nijedan generisani dokument</h2>
        <button 
          onClick={() => navigate('/generator')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Generiši novi dokument
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Istorija dokumenata</h2>
      
      <div className="space-y-4">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 cursor-pointer"
            onClick={() => handleViewDocument(doc.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{doc.title}</h3>
                <p className="text-sm text-gray-500">
                  Tip: {doc.document_type} | Kreiran: {format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
              <button 
                className="text-blue-600 hover:text-blue-800" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDocument(doc.id);
                }}
              >
                Pregledaj
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}