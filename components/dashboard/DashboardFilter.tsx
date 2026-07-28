"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export type DateRange = {
  startDate: string;
  endDate: string;
};

type Preset = "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

export function DashboardFilter({ 
  onFilterChange 
}: { 
  onFilterChange: (range: DateRange) => void 
}) {
  const [preset, setPreset] = useState<Preset>("this_month");
  
  // Custom date state
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    if (newPreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (newPreset === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (newPreset === "this_quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      end = new Date(now.getFullYear(), (currentQuarter * 3) + 3, 0);
    } else if (newPreset === "this_year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else if (newPreset === "custom") {
      // Don't auto-fetch until they hit apply or enter valid dates
      return;
    }

    // Format as YYYY-MM-DD
    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];
    
    setCustomStart(startDate);
    setCustomEnd(endDate);
    
    onFilterChange({ startDate, endDate });
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onFilterChange({ startDate: customStart, endDate: customEnd });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-default)] p-1.5 rounded-xl shadow-sm w-full sm:w-auto">
      <div className="flex items-center gap-2 px-2 text-[var(--text-secondary)] border-r border-[var(--border-default)] pr-3 hidden sm:flex">
        <Calendar className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Date</span>
      </div>
      
      <select 
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value as Preset)}
        className="text-sm font-medium bg-transparent border-none text-[var(--text-heading)] focus:ring-0 cursor-pointer outline-none w-full sm:w-auto py-1"
      >
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="this_quarter">This Quarter</option>
        <option value="this_year">This Year</option>
        <option value="custom">Custom Range</option>
      </select>

      {preset === "custom" && (
        <div className="flex items-center gap-2 border-l border-[var(--border-default)] pl-3 w-full sm:w-auto">
          <input 
            type="date" 
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-xs p-1.5 border border-[var(--border-default)] rounded bg-[var(--bg-app)] text-[var(--text-heading)]"
          />
          <span className="text-[var(--text-muted)] text-xs">to</span>
          <input 
            type="date" 
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-xs p-1.5 border border-[var(--border-default)] rounded bg-[var(--bg-app)] text-[var(--text-heading)]"
          />
          <button 
            onClick={handleCustomApply}
            className="text-xs bg-[var(--brand-primary)] text-white px-2.5 py-1.5 rounded font-semibold hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
