import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Noto Sans',
  fonts: [
    {
      src: '/fonts/NotoSans-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/NotoSans-Bold.ttf',
      fontWeight: 'bold',
    }
  ]
});

// Definišemo tip za podatke iz forme
type FormData = {
  freelancerName: string;
  freelancerAddress: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerPib?: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  projectName: string;
  projectDescription: string;
  startDate: string;
  endDate: string;
  contractType: string;
  price: string;
  currency: 'EUR' | 'RSD';
  paymentType: 'full' | 'milestone' | 'monthly';
  milestoneDetails?: string;
  paymentMethod: 'bank' | 'paypal' | 'crypto' | 'other';
  language: 'sr' | 'en';
};

// Definišemo props interfejs
interface GeneratedPDFProps {
  content: string;
  formData: FormData;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 10
  }
});

const GeneratedPDF: React.FC<GeneratedPDFProps> = ({ content, formData }) => {
  // Uklanjamo markdown oznake i formatiramo tekst
  const formattedContent = content
    .replace(/\*\*/g, '')  // Uklanjamo zvezdice
    .split('\n')           // Delimo tekst na linije
    .map(line => line.trim()); // Uklanjamo višak razmaka

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {formattedContent.map((line, index) => {
          if (index === 0) {
            // Glavni naslov
            return <Text key={index} style={styles.mainTitle}>{line}</Text>;
          } else if (line.toUpperCase() === line && line.length > 0) {
            // Naslovi sekcija
            return <Text key={index} style={styles.sectionTitle}>{line}</Text>;
          } else {
            // Običan tekst
            return <Text key={index} style={styles.content}>{line}</Text>;
          }
        })}
      </Page>
    </Document>
  );
};

export default GeneratedPDF;
