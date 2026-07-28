/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, Menu } from "lucide-react";
import { InstanceList } from "@/components/final-check/InstanceList";
import { ChecklistPanel } from "@/components/final-check/ChecklistPanel";
import { ErrorState } from "@/components/ui/ErrorState";

export default function FinalCheckPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const { data: instances, isLoading, isError, refetch } = useQuery({
    queryKey: ["final-checks"],
    queryFn: async () => {
      const res = await fetch("/api/final-check", { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error("Failed to load checklists");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 10000,
  });

  const activeInstance = instances?.find((i: any) => i.id === activeId);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setIsMobileListOpen(false); // Close drawer on mobile after selection
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Final Check</h1>
          <p className="text-sm text-slate-500 mt-1">Verify 51-point pre-delivery protocol checkpoints.</p>
        </div>
        
        {/* Mobile toggle button */}
        <button 
          className="md:hidden p-2 bg-white border rounded-md shadow-sm"
          onClick={() => setIsMobileListOpen(!isMobileListOpen)}
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="flex-1 bg-white border rounded-xl overflow-hidden shadow-sm flex relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-forest animate-spin" />
              <p className="text-sm font-medium text-slate-600">Loading instances...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <ErrorState message="Failed to load Final Check instances." onRetry={() => refetch()} />
          </div>
        ) : (
          <>
            {/* Left Panel - Instance List */}
            <div className={`
              absolute inset-y-0 left-0 w-full md:relative md:w-1/3 border-r bg-white z-20 transition-transform duration-300 ease-in-out
              ${isMobileListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <InstanceList 
                instances={instances || []} 
                activeId={activeId} 
                onSelect={handleSelect} 
              />
            </div>

            {/* Right Panel - Checklist */}
            <div className="flex-1 w-full bg-slate-50 relative z-10 overflow-hidden">
              <ChecklistPanel 
                instance={activeInstance} 
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Mobile Backdrop Overlay */}
            {isMobileListOpen && (
              <div 
                className="absolute inset-0 bg-black/20 z-10 md:hidden"
                onClick={() => setIsMobileListOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
