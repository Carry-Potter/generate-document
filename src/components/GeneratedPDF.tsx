import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20 },
  section: { marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  text: { fontSize: 14 },
});

interface GeneratedPDFProps {
  formData: { name: string; email: string; message: string };
}

export default function GeneratedPDF({ formData }: GeneratedPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Generated Document</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Name: {formData.name}</Text>
          <Text style={styles.text}>Email: {formData.email}</Text>
          <Text style={styles.text}>Message: {formData.message}</Text>
        </View>
      </Page>
    </Document>
  );
}
