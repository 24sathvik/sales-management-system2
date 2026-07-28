/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { differenceInDays, startOfDay } from "date-fns";

const getPriorityColor = (dateStr: string | null, status: string, isComplete: boolean) => {
  if (isComplete || !dateStr || status !== "ACTIVE") return "bg-slate-300";

  const finalDate = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(finalDate, today);

  if (diff < 0) return "bg-red-600";
  if (diff >= 0 && diff <= 2) return "bg-red-400";
  if (diff >= 3 && diff <= 6) return "bg-amber-400";
  if (diff >= 7 && diff <= 14) return "bg-yellow-400";
  return "bg-green-400";
};

// Calculate how many boolean fields are true
const getProgress = (instance: any) => {
  if (!instance) return 0;
  let count = 0;
  const keys = Object.keys(instance);
  for (const k of keys) {
    if (typeof instance[k] === "boolean" && k !== "isComplete" && instance[k] === true) {
      count++;
    }
  }
  return count;
};

export function InstanceList({ 
  instances, 
  activeId, 
  onSelect 
}: { 
  instances: any[]; 
  activeId: string | null; 
  onSelect: (id: string) => void;
}) {
  const openInstances = instances.filter(i => !i.isComplete);
  const closedInstances = instances.filter(i => i.isComplete);

  const renderItem = (instance: any) => {
    const isActive = instance.id === activeId;
    const progress = getProgress(instance);
    const total = 51;
    const percent = Math.round((progress / total) * 100);
    const priorityDot = getPriorityColor(
      instance.invoice?.finalDeliveryDate, 
      instance.invoice?.status, 
      instance.isComplete
    );

    return (
      <button
        key={instance.id}
        onClick={() => onSelect(instance.id)}
        className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors flex flex-col gap-2 ${
          isActive ? "bg-blue-50/50 border-l-4 border-l-brand-orange" : "border-l-4 border-l-transparent"
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="font-bold text-sm text-brand-forest flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${priorityDot}`} />
            {instance.invoiceNumber}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {progress}/{total}
          </span>
        </div>
        <div className="text-sm font-semibold text-slate-800 truncate">
          {instance.invoice?.customerName || "Unknown Customer"}
        </div>
        <div className="text-xs text-slate-500 line-clamp-1">
          {instance.description}
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
          <div 
            className={`h-1.5 rounded-full ${instance.isComplete ? 'bg-green-500' : 'bg-brand-forest'}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <div className="p-4 border-b bg-slate-50 sticky top-0 z-10">
        <h2 className="font-bold text-slate-800">Active Jobs ({openInstances.length})</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        {openInstances.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active final checks.
          </div>
        )}
        {openInstances.map(renderItem)}

        {closedInstances.length > 0 && (
          <div className="mt-6">
            <div className="p-4 border-y bg-slate-50">
              <h2 className="font-bold text-slate-800">Completed Jobs ({closedInstances.length})</h2>
            </div>
            {closedInstances.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  );
}
