import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Languages, Lock, Download, CreditCard, LogOut, Loader2 } from 'lucide-react';
import Button from './components/Button';
import AuthModal from './components/AuthModal';
import PDFPreview from './components/PDFPreview';
import { supabase } from './lib/supabase';
import { createDocument, generateDocument, getUserDocuments } from './lib/documents';
import type { Document } from './lib/types';

type FormData = {
  fullName: string;
  companyName: string;
  serviceType: string;
  price: string;
  language: 'en' | 'sr' | 'hr' | 'sl';
};

function App() {
  const [step, setStep] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserDocuments();
    }
  }, [user]);

  const loadUserDocuments = async () => {
    try {
      const docs = await getUserDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const generateDocumentContent = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      // First create a document record
      const doc = await createDocument({
        title: `${data.serviceType} Contract - ${data.companyName}`,
        content: '',
        language: data.language,
        service_type: data.serviceType,
        company_name: data.companyName,
        price: parseFloat(data.price),
      });

      // For development, generate a mock contract since we don't have DeepSeek API access
      const mockContract = `
SERVICE AGREEMENT

This Service Agreement (the "Agreement") is made between:

Provider: ${data.fullName}
Company: ${data.companyName}

1. SERVICES
The Provider agrees to provide ${data.serviceType} services as outlined in this agreement.

2. COMPENSATION
The Client agrees to pay the Provider the sum of ${data.price} for the services rendered.

3. TERM
This Agreement shall commence upon signing and continue until the services are completed.

4. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information shared during the course of this engagement.

5. INTELLECTUAL PROPERTY
All intellectual property created during the course of this engagement shall belong to the Client upon full payment.

6. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

Date: ${new Date().toLocaleDateString()}
      `;
      
      // Update the document with generated content
      await generateDocument(doc.id, mockContract);
      
      // Create PDF preview
      const pdfBlob = new Blob([mockContract], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfPreview(pdfUrl);
      await loadUserDocuments();
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    await generateDocumentContent(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">LegalDocs Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsAuthModalOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Legal Documents in Minutes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create professional contracts and legal documents tailored to your business needs.
            No lawyers needed.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Languages className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi-language Support</h3>
            <p className="text-gray-600">Generate documents in Serbian, Croatian, Slovenian, and English.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Lock className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure & Encrypted</h3>
            <p className="text-gray-600">Your data is protected with end-to-end encryption.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Download className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Download</h3>
            <p className="text-gray-600">Get your documents in PDF or Word format instantly.</p>
          </div>
        </div>

        {/* Document Generator Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...register('fullName', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">Full name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  {...register('companyName', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Acme Inc."
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">Company name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  {...register('serviceType', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select service type...</option>
                  <option value="it">IT Services</option>
                  <option value="marketing">Marketing</option>
                  <option value="design">Design</option>
                  <option value="consulting">Consulting</option>
                </select>
                {errors.serviceType && (
                  <p className="mt-1 text-sm text-red-600">Service type is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  {...register('price', { required: true, min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="1000"
                  type="number"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">Valid price is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  {...register('language', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="sr">Serbian</option>
                  <option value="hr">Croatian</option>
                  <option value="sl">Slovenian</option>
                </select>
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">Language is required</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Document...
                  </>
                ) : (
                  'Generate Document'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Choose Your Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Single Document</h4>
                  <p className="text-2xl font-bold mb-2">€5</p>
                  <Button variant="outline" className="w-full">
                    Select
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold mb-2">Monthly Subscription</h4>
                  <p className="text-2xl font-bold mb-2">€15/month</p>
                  <Button className="w-full">
                    Select
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Documents */}
        {user && documents.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">Recent Documents</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{doc.service_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{doc.language}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          doc.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'generated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
      {pdfPreview && (
        <PDFPreview
          pdfData={pdfPreview}
          onClose={() => setPdfPreview(null)}
          onProceed={() => {
            setPdfPreview(null);
            setStep(2);
          }}
        />
      )}
    </div>
  );
}

export default App;