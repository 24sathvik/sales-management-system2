/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center font-sans">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Critical Application Error</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            A fatal error occurred at the root level.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

