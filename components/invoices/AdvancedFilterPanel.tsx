/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronUp, X, Filter, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AdvancedFilterPanel({ users }: { users: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    fetch("/api/invoice-categories")
      .then(r => r.json())
      .then(json => setCategories(Array.isArray(json.data) ? json.data : []));
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Set page to 1 whenever filters change
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const currentSearch = searchParams.get("search") || "";
  const currentAssignee = searchParams.get("assigneeId") || "all";
  const currentStatus = searchParams.get("status") || "ACTIVE";

  // Advanced params
  const currentCategory = searchParams.get("category") || "";
  const currentPrintingColor = searchParams.get("printingColor") || "";
  const currentDesigner = searchParams.get("designer") || "";
  const currentPrinter = searchParams.get("printer") || "";
  const currentDeliveryFrom = searchParams.get("deliveryDateFrom") || "";
  const currentDeliveryTo = searchParams.get("deliveryDateTo") || "";
  const currentCreatedFrom = searchParams.get("createdFrom") || "";
  const currentCreatedTo = searchParams.get("createdTo") || "";
  const currentMinAmount = searchParams.get("minAmount") || "";
  const currentMaxAmount = searchParams.get("maxAmount") || "";
  const currentPacking = searchParams.get("packing") || "ALL";
  const currentAdvance = searchParams.get("advancePaid") || "ALL";

  // Debounced Search state locally so we don't spam router.replace on every keystroke
  const [localSearch, setLocalSearch] = useState(currentSearch);
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== currentSearch) updateParam("search", localSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const activeFiltersCount = Array.from(searchParams.keys()).filter(k => 
    !["page", "limit", "sortBy", "order", "search", "assigneeId", "status"].includes(k)
  ).length;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    const preserve = ["page", "limit", "sortBy", "order"];
    for (const key of Array.from(params.keys())) {
      if (!preserve.includes(key)) params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setLocalSearch("");
  };

  const handleCategoryToggle = (catName: string) => {
    const activeCats = currentCategory ? currentCategory.split(",") : [];
    if (activeCats.includes(catName)) {
      updateParam("category", activeCats.filter(c => c !== catName).join(","));
    } else {
      updateParam("category", [...activeCats, catName].join(","));
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-brand-border shadow-sm mb-4 font-sans space-y-4">
      {/* Quick Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-[2]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search invoice or customer..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-sm border border-brand-border rounded-md focus:ring-2 focus:ring-brand-sage outline-none bg-white"
          />
        </div>
        
        <select 
          value={currentAssignee} 
          onChange={(e) => updateParam("assigneeId", e.target.value)}
          className="flex-1 px-3 h-10 text-sm border border-brand-border rounded-md focus:ring-2 focus:ring-brand-sage outline-none bg-white"
        >
          <option value="all">All Assignees</option>
          {users?.map((u: any) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select 
          value={currentStatus} 
          onChange={(e) => updateParam("status", e.target.value)}
          className="flex-1 px-3 h-10 text-sm border border-brand-border rounded-md focus:ring-2 focus:ring-brand-sage outline-none bg-white font-medium"
        >
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="ALL">All Statuses</option>
        </select>

        <button 
          onClick={() => setExpanded(!expanded)}
          className={`flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-semibold transition-colors border ${
            expanded || activeFiltersCount > 0 
              ? "bg-brand-forest text-white border-brand-forest" 
              : "bg-brand-cream text-brand-forest border-brand-border hover:bg-brand-cream/70"
          }`}
        >
          <Filter className="w-4 h-4" />
          Advanced Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Advanced Filter Collapse Panel */}
      {expanded && (
        <div className="pt-4 border-t border-brand-border animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Categories Multi-Select Box */}
            <div className="space-y-2 lg:row-span-2">
              <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Categories</label>
              <div className="bg-brand-cream/20 border border-brand-border rounded-md p-3 max-h-[220px] overflow-y-auto space-y-2">
                {categories.length === 0 ? <Loader2 className="w-4 h-4 animate-spin text-brand-sage mx-auto" /> : 
                  categories.map(c => {
                    const active = currentCategory.split(",").includes(c.name);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-brand-cream p-1 rounded transition-colors text-brand-black">
                        <input 
                          type="checkbox" 
                          checked={active}
                          onChange={() => handleCategoryToggle(c.name)}
                          className="rounded border-brand-muted text-brand-forest focus:ring-brand-sage w-4 h-4"
                        />
                        {c.name}
                      </label>
                    )
                  })
                }
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Tracking Fields</label>
                <input type="text" placeholder="Printing Color" value={currentPrintingColor} onChange={e => updateParam("printingColor", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none placeholder:text-brand-muted" />
                <input type="text" placeholder="Designer Name" value={currentDesigner} onChange={e => updateParam("designer", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none placeholder:text-brand-muted" />
                <input type="text" placeholder="Printer Name" value={currentPrinter} onChange={e => updateParam("printer", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none placeholder:text-brand-muted" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Job Status</label>
                <select value={currentPacking} onChange={e => updateParam("packing", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none">
                  <option value="ALL">Packing: All</option>
                  <option value="WITH_PACKING">With Packing</option>
                  <option value="WITHOUT_PACKING">Without Packing</option>
                </select>
                <select value={currentAdvance} onChange={e => updateParam("advancePaid", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none">
                  <option value="ALL">Advance Payment: All</option>
                  <option value="Paid">Advance Paid</option>
                  <option value="Unpaid">Unpaid Advance</option>
                </select>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Delivery Date Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={currentDeliveryFrom} onChange={e => updateParam("deliveryDateFrom", e.target.value)} className="w-full px-2 h-9 text-xs border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none" title="From" />
                  <span className="text-slate-400">-</span>
                  <input type="date" value={currentDeliveryTo} onChange={e => updateParam("deliveryDateTo", e.target.value)} className="w-full px-2 h-9 text-xs border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none" title="To" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Created Date Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={currentCreatedFrom} onChange={e => updateParam("createdFrom", e.target.value)} className="w-full px-2 h-9 text-xs border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none" title="From" />
                  <span className="text-slate-400">-</span>
                  <input type="date" value={currentCreatedTo} onChange={e => updateParam("createdTo", e.target.value)} className="w-full px-2 h-9 text-xs border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none" title="To" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Amount Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min ₹" value={currentMinAmount} onChange={e => updateParam("minAmount", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none placeholder:text-brand-muted" />
                  <span className="text-slate-400">-</span>
                  <input type="number" placeholder="Max ₹" value={currentMaxAmount} onChange={e => updateParam("maxAmount", e.target.value)} className="w-full px-3 h-9 text-sm border border-brand-border rounded-md bg-white focus:ring-1 focus:ring-brand-sage outline-none placeholder:text-brand-muted" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(activeFiltersCount > 0 || currentSearch || currentAssignee !== "all" || currentStatus !== "ACTIVE") && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {currentSearch && <Chip label={`Search: ${currentSearch}`} onRemove={() => { setLocalSearch(""); removeFilter("search"); }} />}
          {currentAssignee !== "all" && <Chip label={`Assignee Active`} onRemove={() => removeFilter("assigneeId")} />}
          {currentStatus !== "ACTIVE" && <Chip label={`Status: ${currentStatus}`} onRemove={() => updateParam("status", "ACTIVE")} />}
          
          {currentCategory && currentCategory.split(",").map(c => (
            <Chip key={c} label={`Cat: ${c}`} onRemove={() => handleCategoryToggle(c)} />
          ))}
          {currentPrintingColor && <Chip label={`Color: ${currentPrintingColor}`} onRemove={() => removeFilter("printingColor")} />}
          {currentDesigner && <Chip label={`Designer: ${currentDesigner}`} onRemove={() => removeFilter("designer")} />}
          {currentPrinter && <Chip label={`Printer: ${currentPrinter}`} onRemove={() => removeFilter("printer")} />}
          {currentPacking !== "ALL" && <Chip label={`Packing: ${currentPacking}`} onRemove={() => removeFilter("packing")} />}
          {currentAdvance !== "ALL" && <Chip label={`Advance: ${currentAdvance}`} onRemove={() => removeFilter("advancePaid")} />}
          
          {(currentDeliveryFrom || currentDeliveryTo) && <Chip label="Delivery Dates" onRemove={() => { removeFilter("deliveryDateFrom"); removeFilter("deliveryDateTo"); }} />}
          {(currentCreatedFrom || currentCreatedTo) && <Chip label="Created Dates" onRemove={() => { removeFilter("createdFrom"); removeFilter("createdTo"); }} />}
          {(currentMinAmount || currentMaxAmount) && <Chip label="Amount Range" onRemove={() => { removeFilter("minAmount"); removeFilter("maxAmount"); }} />}

          <button onClick={clearAllFilters} className="text-xs font-semibold text-brand-danger hover:text-brand-danger/80 ml-2 transition-colors">
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string, onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-sage/20 text-brand-forest border border-brand-sage/30">
      <span className="truncate max-w-[150px]">{label}</span>
      <button onClick={onRemove} className="hover:bg-brand-sage/40 rounded-full p-0.5 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

