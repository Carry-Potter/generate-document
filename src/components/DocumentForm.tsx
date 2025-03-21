import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import GeneratedPDF from './GeneratedPDF';
import { createDocument, generateDocument } from '../lib/documents';
import Button from './Button';

import { openai } from '../lib/openai';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type FormData = {
  // Freelancer details
  freelancerName: string;
  freelancerAddress: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerPib?: string;

  // Client details
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;

  // Project details
  projectName: string;
  projectDescription: string;
  startDate: string;
  endDate: string;

  // Contract type
  contractType: 'service' | 'copyright' | 'license' | 'retainer' | 'nda' | 'exclusive' | 'subcontract' | 'other';

  // Payment details
  price: string;
  currency: 'EUR' | 'RSD';
  paymentType: 'full' | 'milestone' | 'monthly';
  milestoneDetails?: string;
  paymentMethod: 'bank' | 'paypal' | 'crypto' | 'other';

  // Language
  language: 'sr' | 'en';
};

export default function DocumentForm({ onDocumentGenerated }: { onDocumentGenerated: (url: string) => void }) {
  const { user, credits, refreshCredits } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      language: i18n.language.startsWith('en') ? 'en' : 'sr',
      currency: 'EUR',
      paymentType: 'full',
      paymentMethod: 'bank',
      contractType: 'service'
    }
  });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const generateDocumentContent = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      if (credits < 1) {
        toast.error(t('document.notEnoughCredits'));
        return;
      }

      const doc = await createDocument({
        title: `${data.projectName} - ${data.clientName}`,
        content: '',
        language: data.language,
        service_type: data.contractType,
        company_name: data.clientName,
        price: parseFloat(data.price),
      });

      if (doc) {
        await refreshCredits();
        
        // Detaljniji prompt za ChatGPT
        const prompt = data.language === 'sr' ? 
          `Kreiraj profesionalan i detaljan ugovor o pružanju usluga. Ugovor treba da bude pravno validan prema srpskom zakonu.
          
          Formatiranje:
          - Naslov ugovora treba da bude velikim slovima i centriran
          - Svi članovi ugovora treba da budu boldovani i velikim slovima
          - Dodaj numeraciju za sve stavke
          - Koristi profesionalnu pravnu terminologiju
          
          Detalji ugovora:
          1. UGOVORNE STRANE:
          Naručilac: ${data.clientName}
          - Adresa: ${data.clientAddress}
          - Email: ${data.clientEmail}
          - Telefon: ${data.clientPhone}
          
          Izvršilac: ${data.freelancerName}
          - Adresa: ${data.freelancerAddress}
          - Email: ${data.freelancerEmail}
          - Telefon: ${data.freelancerPhone}
          ${data.freelancerPib ? `- PIB: ${data.freelancerPib}` : ''}
          
          2. PREDMET UGOVORA:
          - Naziv projekta: ${data.projectName}
          - Detaljan opis: ${data.projectDescription}
          
          3. ROKOVI:
          - Početak: ${new Date(data.startDate).toLocaleDateString('sr-Latn')}
          - Završetak: ${new Date(data.endDate).toLocaleDateString('sr-Latn')}
          
          4. FINANSIJSKI USLOVI:
          - Iznos: ${data.price} ${data.currency}
          - Način plaćanja: ${data.paymentMethod}
          - Dinamika plaćanja: ${data.paymentType}
          ${data.milestoneDetails ? `- Detalji plaćanja po fazama: ${data.milestoneDetails}` : ''}
          
          Obavezno uključi sledeće članove:
          - Predmet ugovora (detaljan opis posla)
          - Prava i obaveze obe strane
          - Rokovi i dinamika izvršenja
          - Cena i način plaćanja
          - Poverljivost podataka
          - Intelektualna svojina
          - Raskid ugovora
          - Viša sila
          - Rešavanje sporova
          - Završne odredbe
          
          Ugovor treba da bude detaljan, profesionalan i da štiti interese obe strane.`
          : 
          `Create a professional and detailed service agreement. The agreement should be legally valid.
          
          Formatting:
          - Title should be in capital letters and centered
          - All articles should be bold and in capital letters
          - Add numbering for all items
          - Use professional legal terminology
          
          Agreement details:
          1. PARTIES:
          Client: ${data.clientName}
          - Address: ${data.clientAddress}
          - Email: ${data.clientEmail}
          - Phone: ${data.clientPhone}
          
          Service Provider: ${data.freelancerName}
          - Address: ${data.freelancerAddress}
          - Email: ${data.freelancerEmail}
          - Phone: ${data.freelancerPhone}
          ${data.freelancerPib ? `- Tax ID: ${data.freelancerPib}` : ''}
          
          2. SCOPE OF WORK:
          - Project name: ${data.projectName}
          - Detailed description: ${data.projectDescription}
          
          3. TIMELINE:
          - Start date: ${new Date(data.startDate).toLocaleDateString('en-US')}
          - End date: ${new Date(data.endDate).toLocaleDateString('en-US')}
          
          4. FINANCIAL TERMS:
          - Amount: ${data.price} ${data.currency}
          - Payment method: ${data.paymentMethod}
          - Payment schedule: ${data.paymentType}
          ${data.milestoneDetails ? `- Milestone payment details: ${data.milestoneDetails}` : ''}
          
          Please include the following sections:
          - Scope of Work (detailed description)
          - Rights and Obligations of both parties
          - Timeline and Execution
          - Price and Payment Terms
          - Confidentiality
          - Intellectual Property
          - Termination
          - Force Majeure
          - Dispute Resolution
          - Final Provisions
          
          The agreement should be detailed, professional and protect both parties' interests.`;

        // Generisanje ugovora
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "Ti si iskusni pravnik specijalizovan za pisanje ugovora. Kreiraj detaljan i profesionalan ugovor koji je pravno validan i štiti interese obe strane."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "gpt-4",
          temperature: 0.4,
          max_tokens: 500, 
        });

        const generatedContract = completion.choices[0].message.content;
        if (!generatedContract) throw new Error("Failed to generate contract");

        // Formatiranje PDF-a
        const formattedContract = generatedContract
          .replace(/\*\*/g, '')  // Uklanjamo postojeće zvezdice
          .replace(
            /(ČLAN \d+\.|Article \d+\.|[A-ZČĆŽŠĐ\s]{5,}:)/g,
            match => match.toUpperCase()  // Samo pretvaramo u velika slova
          );

        await generateDocument(doc.id, formattedContract);

        const blob = await pdf(
          <GeneratedPDF 
            content={formattedContract}
            formData={data}
          />
        ).toBlob();

        const pdfUrl = URL.createObjectURL(blob);
        onDocumentGenerated(pdfUrl);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error(t('document.generationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Kreiranje ugovora</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-800">{t('document.availableCredits')}</h3>
          <p className="text-xl font-bold text-blue-600">{credits}</p>
        </div>
        
        {credits < 1 && (
          <button 
            onClick={() => navigate('/pricing')}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {t('document.buyCredits')}
          </button>
        )}
      </div>
      
      {credits < 1 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            {t('document.notEnoughCredits')}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(generateDocumentContent)} className="space-y-8">
        {/* Freelancer Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">1. Podaci o freelanceru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ime i prezime / Naziv firme
              </label>
              <input
                {...register('freelancerName', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresa
              </label>
              <input
                {...register('freelancerAddress', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('freelancerEmail', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                {...register('freelancerPhone', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIB (opciono)
              </label>
              <input
                {...register('freelancerPib')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Client Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">2. Podaci o klijentu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ime i prezime / Naziv firme
              </label>
              <input
                {...register('clientName', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresa
              </label>
              <input
                {...register('clientAddress', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('clientEmail', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                {...register('clientPhone', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">3. Detalji projekta</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naziv projekta
            </label>
            <input
              {...register('projectName', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis posla/usluge
            </label>
            <textarea
              {...register('projectDescription', { required: true })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Contract Type */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">4. Vrsta ugovora</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'service', label: 'Ugovor o delu' },
              { value: 'copyright', label: 'Autorski ugovor' },
              { value: 'license', label: 'Ugovor o licenciranju' },
              { value: 'retainer', label: 'Retainer ugovor' },
              { value: 'nda', label: 'Ugovor o poverljivosti (NDA)' },
              { value: 'exclusive', label: 'Ugovor o ekskluzivnosti' },
              { value: 'subcontract', label: 'Ugovor o podugovaranju' },
              { value: 'other', label: 'Drugo' }
            ].map((type) => (
              <div key={type.value} className="flex items-center">
                <input
                  type="radio"
                  {...register('contractType', { required: true })}
                  value={type.value}
                  id={type.value}
                  className="mr-2"
                />
                <label htmlFor={type.value}>{type.label}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">5. Način isplate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena (EUR)
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
                Valuta
              </label>
              <select
                {...register('currency', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="EUR">EUR</option>
                <option value="RSD">RSD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tip plaćanja
              </label>
              <select
                {...register('paymentType', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="full">Puna</option>
                <option value="milestone">Mejleni</option>
                <option value="monthly">Mesecno</option>
              </select>
            </div>
            {watch('paymentType') === 'milestone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalji mejlenog plaćanja
                </label>
                <textarea
                  {...register('milestoneDetails')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Način plaćanja
              </label>
              <select
                {...register('paymentMethod', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="bank">Bankovni račun</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Kriptovaluta</option>
                <option value="other">Drugo</option>
              </select>
            </div>
            {watch('paymentMethod') === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drugi način plaćanja
                </label>
                
              </div>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Jezik dokumenta</h3>
          <div>
            <select
              {...register('language', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="sr">Srpski</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Datumi projekta */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Period projekta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum početka
              </label>
              <input
                type="date"
                {...register('startDate', { 
                  required: "Datum početka je obavezan",
                  validate: value => {
                    if (new Date(value) < new Date()) {
                      return "Datum početka ne može biti u prošlosti";
                    }
                    return true;
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum završetka
              </label>
              <input
                type="date"
                {...register('endDate', { 
                  required: "Datum završetka je obavezan",
                  validate: value => {
                    const startDate = watch('startDate');
                    if (startDate && new Date(value) <= new Date(startDate)) {
                      return "Datum završetka mora biti nakon datuma početka";
                    }
                    return true;
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={isLoading || credits < 1}
            className={`w-full py-2 px-4 rounded font-medium ${
              credits < 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? t('document.generating') : t('document.generate')}
          </Button>
        </div>
      </form>
    </div>
  );
}