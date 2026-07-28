import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full min-h-[300px] border border-[var(--status-error)] rounded-xl bg-[var(--status-error-bg)]">
      <div className="w-16 h-16 bg-[var(--status-error-bg)] rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-[var(--status-error)]" />
      </div>
      <h3 className="text-[18px] font-display font-bold text-[var(--status-error-text)] mb-2">Failed to load data</h3>
      <p className="text-[14px] text-[var(--status-error-text)] max-w-sm mb-6">
        {message || "We encountered an issue while trying to fetch the requested information. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--status-error)] text-white font-semibold rounded-md shadow-[0_4px_14px_rgba(220,38,38,0.30)] hover:brightness-90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
}
