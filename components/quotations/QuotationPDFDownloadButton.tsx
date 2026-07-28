/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";

export default function QuotationPDFDownloadButton({ quotationData }: { quotationData: any }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { generateQuotationPdf } = await import("@/lib/pdf/generateQuotationPdf");
      await generateQuotationPdf(quotationData);
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
      className="inline-flex items-center justify-center rounded-md bg-accent text-white hover:bg-accent-dark px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      Download Quote PDF
    </button>
  );
}

