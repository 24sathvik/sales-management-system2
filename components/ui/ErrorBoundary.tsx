"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ZyOpsLogo } from "./ZyOpsLogo";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // In a Next.js app, doing a router.refresh() might be necessary 
    // but a state clear often re-renders children which might fix temporary issues.
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6 text-center animate-in fade-in">
          <div className="bg-white border border-red-100 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <div className="mb-6">
              <ZyOpsLogo size="md" theme="light" showWordmark={false} />
            </div>
            
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-display font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-6">
              {this.state.error?.message || "An unexpected error occurred while rendering this component."}
            </p>
            
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
