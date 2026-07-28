"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500); // UI feedback duration
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-[var(--radius-lg)] hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-700 bg-white shadow-sm border-slate-200"
      title="Refresh Stats"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : "text-slate-500"}`} />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
