/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";

export default function PDFDownloadButton({ pdfData, invoiceNumber }: { pdfData: any, invoiceNumber: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { generateInvoicePdf } = await import("@/lib/pdf/generateInvoicePdf");
      
      // Ensure the invoice number is passed properly
      await generateInvoicePdf({
        ...pdfData,
        invoiceNumber: invoiceNumber
      });
      
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      Download PDF
    </button>
  );
}

