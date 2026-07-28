"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard area error:", error);
  }, [error]);

  return (
    <div className="h-full min-h-[400px] w-full flex items-center justify-center p-6">
      <div className="bg-white border border-card-border shadow-sm rounded-xl p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-slate-800">Unable to load this section</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            There was a problem loading this part of the dashboard. This might be a temporary issue.
          </p>
        </div>

        <div className="pt-4 border-t">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 mx-auto bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors active:scale-95 shadow-md shadow-primary/20"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
