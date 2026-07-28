"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Plus, Loader2, Settings2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { ManageCategoriesModal } from "./manage-categories-modal";

export function CategoryCombobox({
  value,
  onChange,
  error
}: {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/invoice-categories")
      .then(res => res.json())
      .then(json => {
        const safeData = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        setCategories(safeData);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = categories.some(c => c.name.toLowerCase() === query.toLowerCase());
  const selectedName = value || "";

  return (
    <>
      <div className="relative w-full text-brand-black" ref={wrapperRef} style={{ fontFamily: "var(--font-quicksand)" }}>
        <div 
          onClick={() => setOpen(!open)}
          className={`flex items-center justify-between h-10 w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer transition-all ${open ? 'ring-2 ring-brand-sage border-transparent' : ''} ${error ? 'border-brand-danger ring-1 ring-brand-danger' : 'border-input hover:border-brand-sage'}`}
        >
          <span className={selectedName ? "text-brand-black font-medium" : "text-brand-muted"}>
            {selectedName || "Select or type category..."}
          </span>
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand-muted" /> : <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`} />}
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-brand-border rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-brand-border bg-brand-cream/30">
              <input 
                autoFocus
                className="w-full h-9 px-3 text-sm bg-white border border-brand-border outline-none rounded focus:border-brand-sage focus:ring-1 focus:ring-brand-sage transition-colors placeholder:text-brand-muted font-medium" 
                placeholder="Search category..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query && !exactMatch) {
                    e.preventDefault();
                    onChange(query);
                    setOpen(false);
                    setQuery("");
                  }
                }}
              />
            </div>
            
            <ul className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {filtered.map(cat => (
                <li 
                  key={cat.id}
                  onClick={() => { onChange(cat.name); setOpen(false); setQuery(""); }}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors hover:bg-brand-cream ${value === cat.name ? "bg-brand-cream font-semibold text-brand-forest" : "font-medium text-brand-black"}`}
                >
                  {cat.name}
                  {value === cat.name && <Check className="w-4 h-4 text-brand-forest" />}
                </li>
              ))}
              
              {query && !exactMatch && (
                <li 
                  onClick={() => { onChange(query); setOpen(false); setQuery(""); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer bg-brand-forest/5 hover:bg-brand-forest hover:text-white text-brand-forest font-semibold mt-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add custom &quot;{query}&quot;
                </li>
              )}
              
              {filtered.length === 0 && !query && (
                <li className="px-3 py-6 text-sm text-center text-brand-muted font-medium">No categories found.</li>
              )}
            </ul>

            {isAdmin && (
              <div 
                onClick={() => { setOpen(false); setManageModalOpen(true); }}
                className="w-full p-2.5 border-t border-brand-border bg-brand-cream/50 hover:bg-brand-cream flex items-center justify-center gap-2 text-xs font-bold text-brand-forest cursor-pointer transition-colors uppercase tracking-wider"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Manage Categories
              </div>
            )}
          </div>
        )}
      </div>

      <ManageCategoriesModal 
        isOpen={manageModalOpen} 
        onClose={() => setManageModalOpen(false)} 
        onCategoriesUpdated={() => fetchCategories()} 
      />
    </>
  );
}
