"use client";

import { useState, useEffect, useRef } from "react";
import { HelpCircle, Search, X, MessageCircleQuestion } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { FAQ, faqData } from "@/lib/help/faq";

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Global event to open help widget
  useEffect(() => {
    const handleOpenHelp = () => setIsOpen(true);
    window.addEventListener("open-help-center", handleOpenHelp);
    return () => window.removeEventListener("open-help-center", handleOpenHelp);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const { data, isLoading } = useQuery<{ success: boolean; data: FAQ[] }>({
    queryKey: ["help-search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/help/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search FAQ");
      return res.json();
    },
    enabled: isOpen && debouncedQuery.length > 0,
  });

  const suggestions = faqData.filter(faq => 
    faq.relevantOn?.some(route => pathname.startsWith(route))
  ).slice(0, 3);

  // Fallback suggestions if none match the route
  const displaySuggestions = suggestions.length > 0 ? suggestions : faqData.slice(0, 3);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div 
          ref={popoverRef}
          className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-3rem)] bg-white border shadow-xl rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200"
        >
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-primary">Help & FAQ</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
          </div>

          <div className="p-2 max-h-[400px] overflow-y-auto">
            {isLoading && debouncedQuery.length > 0 && (
              <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
            )}
            
            {debouncedQuery.length > 0 && data?.success && data.data.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500">
                No matching answers found. Try different keywords.
              </div>
            )}

            {debouncedQuery.length === 0 && displaySuggestions.length > 0 && (
              <div className="p-3 bg-slate-50 border-b mb-2 rounded-lg">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageCircleQuestion className="w-3.5 h-3.5" /> Suggested for you
                </h4>
                {displaySuggestions.map((faq) => (
                  <div key={faq.id} className="p-3 mb-2 bg-white rounded-lg border border-transparent shadow-sm hover:border-slate-200 transition-colors">
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">{faq.question}</h4>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="p-1">
              {Object.entries(
                (debouncedQuery.length > 0 && data?.success ? data.data : faqData).reduce((acc, faq) => {
                  const cat = faq.category || "General";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(faq);
                  return acc;
                }, {} as Record<string, FAQ[]>)
              ).map(([category, faqs]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{category}</h4>
                  {faqs.map((faq) => (
                    <div key={faq.id} className="p-3 mb-1 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">{faq.question}</h4>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 tour-help-widget"
        title="Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
