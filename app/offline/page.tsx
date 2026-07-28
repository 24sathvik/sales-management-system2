"use client";

import { WifiOff, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-default)] p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-[var(--bg-app)] rounded-full flex items-center justify-center mb-6">
          <WifiOff className="w-8 h-8 text-[var(--text-secondary)]" />
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--text-heading)] mb-2 font-display">You are offline</h1>
        <p className="text-[var(--text-secondary)] mb-8 text-sm">
          It looks like you've lost your internet connection. We cannot load live data right now, to ensure you don't see any stale financial information.
        </p>

        <div className="w-full space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 h-11 bg-[var(--bg-sidebar)] text-white font-bold rounded-xl transition-colors hover:bg-black/90"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full flex items-center justify-center h-11 bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-heading)] font-semibold rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
