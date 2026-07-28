"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white border shadow-sm rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-slate-800">Something went wrong</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            We encountered an unexpected issue while loading this page. 
            Don't worry, your data is safe.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
