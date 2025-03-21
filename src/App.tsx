import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { FileText, Languages, Lock, Download,  CheckCircle, ArrowRight } from 'lucide-react';
import Button from './components/Button';
import AuthModal from './components/AuthModal';
import PDFPreview from './components/PDFPreview';
import { supabase } from './lib/supabase';

//import {  getUserDocuments } from './lib/documents';
//import type { Document } from './lib/types';
import { User } from '@supabase/supabase-js';
import { UserProvider } from './context/UserContext';

import { motion } from 'framer-motion';
import Login from './components/AuthModal';

import DocumentForm from './components/DocumentForm';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import Pricing from './components/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

function App() {
 // const [ setStep] = useState(1);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  
  //const [documents, setDocuments] = useState<Document[]>([]);
 
  const [showForm, setShowForm] = useState(false);

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
    //  const docs = await getUserDocuments();
     // setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  



 
  const handleGetStarted = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setShowForm(true);
    }
  };
  
  const handleDocumentGenerated = (pdfUrl: string) => {
    setPdfPreview(pdfUrl);
    setShowForm(false);
  };
  const NotFound = () => {
  return (
    <div>
      <h2>Stranica nije pronađena</h2>
      <p>Žao nam je, ali stranica koju tražite ne postoji.</p>
    </div>
  );
};


  return (<UserProvider>
    <BrowserRouter>

    <div className="min-h-screen bg-gray-50">
      {/* Zaglavlje */}
       <Navbar 
          
          
        />   
         <Routes>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<AuthModal isOpen={true} onClose={() => {}} />} />
          
          <Route path="/profile" element={<Profile />} />
         
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {!showForm ? (
                <div className="text-center">
                  
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <DocumentForm onDocumentGenerated={handleDocumentGenerated} />
                </div>
              )}
            </main>
          } />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
        
  
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showForm ? (
          <>
            {/* Uvodna Sekcija */}
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center mb-24"
            >
              <motion.h1 
                variants={fadeIn}
                className="text-6xl font-bold text-gray-900 mb-6 tracking-tight"
              >
                Pravni Dokumenti,<br/>
                <span className="text-blue-600">Pojednostavljeni</span>
              </motion.h1>
              <motion.p 
                variants={fadeIn}
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
              >
                Generišite profesionalne pravne dokumente za nekoliko minuta. Uštedite vreme i novac 
                uz naš automatizovani sistem za generisanje dokumenata.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Button 
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-4"
                >
                  Započnite <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
  
            {/* Mreža Funkcionalnosti */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
            >
              {[
                {
                  icon: Languages,
                  title: "Višejezična Podrška",
                  description: "Generišite dokumente na srpskom, engleskom i drugim jezicima sa savršenom podrškom za karaktere."
                },
                {
                  icon: Lock,
                  title: "Bankarska Sigurnost",
                  description: "Vaši dokumenti su zaštićeni enkripcijom i sigurnosnim merama poslovnog nivoa."
                },
                {
                  icon: Download,
                  title: "Trenutno Generisanje",
                  description: "Dobijte svoje profesionalne dokumente u PDF formatu za nekoliko sekundi."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <feature.icon className="h-12 w-12 text-blue-600 mb-6" />
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
  
            {/* Sekcija Prednosti */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="mb-24"
            >
              <motion.h2 
                variants={fadeIn}
                className="text-4xl font-bold text-center mb-16"
              >
                Zašto Izabrati Našu Platformu?
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                  "Uštedite do 90% na troškovima pravnih dokumenata",
                  "Generišite dokumente za manje od 5 minuta",
                  "Pravno usklađeni šabloni",
                  "Generisanje dokumenata 24/7",
                  "Redovno ažuriranje šablona",
                  "Sigurno čuvanje podataka"
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={fadeIn}
                    className="flex items-center space-x-4"
                  >
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="mb-24"
>
  <motion.h2 
    variants={fadeIn}
    className="text-4xl font-bold text-center mb-16"
  >
    Tri jednostavna koraka
  </motion.h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
    {[
      {
        step: "01",
        title: "Izaberite Template",
        description: "Bogata kolekcija pravnih dokumenata prilagođenih srpskom zakonodavstvu",
        icon: FileText
      },
      {
        step: "02",
        title: "Popunite Podatke",
        description: "Intuitivni formular koji vas vodi kroz proces",
        icon: Languages
      },
      {
        step: "03",
        title: "Preuzmite PDF",
        description: "Trenutno generisanje i preuzimanje spremnog dokumenta",
        icon: Download
      }
    ].map((item, index) => (
      <motion.div
        key={index}
        variants={fadeIn}
        className="bg-white rounded-2xl p-8 relative overflow-hidden group hover:shadow-xl transition-all"
      >
        <div className="absolute -right-4 -top-4 text-8xl font-bold text-gray-100 group-hover:text-blue-50 transition-colors">
          {item.step}
        </div>
        <div className="relative z-10">
          <item.icon className="h-12 w-12 text-blue-600 mb-6" />
          <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
          <p className="text-gray-600">{item.description}</p>
        </div>
      </motion.div>
    ))}
  </div>
</motion.div>

{/* Document Types Section */}
<motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="mb-24"
>
  <motion.h2 
    variants={fadeIn}
    className="text-4xl font-bold text-center mb-16"
  >
    Vrste Dokumenata
  </motion.h2>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[
      { title: "Ugovori o radu", count: "10+ templejta" },
      { title: "Ugovori o delu", count: "8+ templejta" },
      { title: "Kupoprodajni ugovori", count: "12+ templejta" },
      { title: "Punomoćja", count: "5+ templejta" },
      { title: "Izjave", count: "15+ templejta" },
      { title: "Fakture", count: "6+ templejta" },
      { title: "Ponude", count: "8+ templejta" },
      { title: "Zapisnici", count: "7+ templejta" }
    ].map((doc, index) => (
      <motion.div
        key={index}
        variants={fadeIn}
        className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <h3 className="font-semibold mb-2">{doc.title}</h3>
        <p className="text-sm text-gray-500">{doc.count}</p>
      </motion.div>
    ))}
  </div>
</motion.div>

{/* Live Preview Section */}
<motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="mb-24 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12"
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <motion.div variants={fadeIn}>
      <h2 className="text-3xl font-bold mb-6">
        Trenutni pregled dokumenta
      </h2>
      <p className="text-gray-600 mb-8">
        Vidite kako će vaš dokument izgledati dok ga kreirate. 
        Naš sistem u realnom vremenu prikazuje sve promene koje unosite.
      </p>
      <div className="space-y-4">
        {[
          "Profesionalno formatiranje",
          "Pravno provereni šabloni",
          "Višejezična podrška",
          "Trenutno preuzimanje"
        ].map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
    <motion.div 
      variants={fadeIn}
      className="bg-white rounded-lg shadow-xl p-6"
    >
      <div className="aspect-w-4 aspect-h-5 bg-gray-100 rounded-lg">
        {/* Ovde možete dodati mock preview dokumenta */}
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </motion.div>
  </div>
</motion.div>


<motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="mb-24"
>
  <motion.h2 
    variants={fadeIn}
    className="text-4xl font-bold mb-16"
  >
    Primeri Dokumenata
  </motion.h2>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
    {/* Ugovor o radu */}
    <motion.div
      variants={fadeIn}
      className="bg-white rounded-xl overflow-hidden shadow-lg"
    >
      <div className="p-6 bg-blue-600 text-white">
        <h3 className="text-xl font-bold">Ugovor o radu</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <strong>UGOVORNE STRANE:</strong>
            <p>1. [Ime Poslodavca], sa sedištem u ...</p>
            <p>2. [Ime Zaposlenog], iz ...</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <strong>PREDMET UGOVORA:</strong>
            <p>Član 1.</p>
            <p>Ovim ugovorom uređuju se prava i obaveze...</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <strong>RADNO VREME:</strong>
            <p>Član 2.</p>
            <p>Zaposleni zasniva radni odnos sa punim radnim vremenom...</p>
          </div>
        </div>
        <Button className="mt-6 w-full">
          Generiši ugovor
        </Button>
      </div>
    </motion.div>

    {/* Ugovor o delu */}
    <motion.div
      variants={fadeIn}
      className="bg-white rounded-xl overflow-hidden shadow-lg"
    >
      <div className="p-6 bg-green-600 text-white">
        <h3 className="text-xl font-bold">Ugovor o delu</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <strong>UGOVORNE STRANE:</strong>
            <p>1. [Ime Naručioca], sa sedištem u ...</p>
            <p>2. [Ime Izvršioca], iz ...</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <strong>PREDMET UGOVORA:</strong>
            <p>Član 1.</p>
            <p>Izvršilac se obavezuje da za potrebe Naručioca izvrši...</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <strong>ROK IZVRŠENJA:</strong>
            <p>Član 2.</p>
            <p>Izvršilac se obavezuje da ugovoreni posao izvrši...</p>
          </div>
        </div>
        <Button className="mt-6 w-full">
          Generiši ugovor
        </Button>
      </div>
    </motion.div>
  </div>
</motion.div>

{/* Quick Actions */}
<motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
>
  {[
    {
      title: "Ugovor o radu",
      description: "Za stalno zaposlene",
      color: "bg-blue-600"
    },
    {
      title: "Ugovor o delu",
      description: "Za jednokratne poslove",
      color: "bg-green-600"
    },
    {
      title: "Autorski ugovor",
      description: "Za kreativne radove",
      color: "bg-purple-600"
    }
  ].map((action, index) => (
    <motion.div
      key={index}
      variants={fadeIn}
      className={`${action.color} text-white rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform`}
      onClick={handleGetStarted}
    >
      <h3 className="text-xl font-bold mb-2">{action.title}</h3>
      <p className="text-white/80">{action.description}</p>
    </motion.div>
  ))}
</motion.div>

{/* Recent Updates */}
<motion.div
  initial="initial"
  whileInView="animate"
  viewport={{ once: true }}
  variants={staggerContainer}
  className="mb-24"
>
  <motion.h2 
    variants={fadeIn}
    className="text-2xl font-bold mb-8"
  >
    Nedavno ažurirani dokumenti
  </motion.h2>
  <div className="space-y-4">
    {[
      {
        title: "Ugovor o radu",
        date: "15.03.2024",
        update: "Usklađeno sa novim Zakonom o radu"
      },
      {
        title: "Ugovor o delu",
        date: "10.03.2024",
        update: "Dodate nove klauzule o intelektualnoj svojini"
      },
      {
        title: "Autorski ugovor",
        date: "05.03.2024",
        update: "Ažurirane odredbe o autorskim pravima"
      }
    ].map((update, index) => (
      <motion.div
        key={index}
        variants={fadeIn}
        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{update.title}</h3>
            <p className="text-sm text-gray-600">{update.update}</p>
          </div>
          <span className="text-sm text-gray-500">{update.date}</span>
        </div>
      </motion.div>
    ))}
  </div>
</motion.div>
         
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            
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
           // setStep(2);
          }}
        />
      )}
    </div>
    </BrowserRouter>
    </UserProvider>
  );
}

export default App;