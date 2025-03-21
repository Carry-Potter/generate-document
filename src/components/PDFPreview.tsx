import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../index.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  pdfData: string;
  onClose: () => void;
  onProceed: () => void;
}

export default function PDFPreview({ pdfData, onClose, onProceed }: PDFPreviewProps) {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('documentPreview')}</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('close')}
            </Button>
            <Button onClick={onProceed}>
              {t('proceedToPayment')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            className="border rounded-lg shadow-lg"
          >
            <Page pageNumber={pageNumber} className="no-select" />
          </Document>

          {numPages > 1 && (
            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="text-sm">
                {t('page')} {pageNumber} {t('of')} {numPages}
              </span>
              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}