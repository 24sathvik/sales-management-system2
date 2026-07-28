/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Check, CheckCircle, Loader2, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Removed hardcoded SECTIONS

export function ChecklistPanel({ 
  instance, 
  isAdmin 
}: { 
  instance: any; 
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);


  const { data: templates } = useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const res = await fetch("/api/settings/checklists");
      if (!res.ok) throw new Error("Failed to fetch checklists");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60000,
  });

  const SECTIONS = templates?.filter((t: any) => t.phase === null) || [];

  useEffect(() => {
    if (instance && templates) {
      const state: Record<string, boolean> = {};
      SECTIONS.forEach((sec: any) => {
        sec.items.forEach((item: any) => {
          // fallback to legacy key if itemId is not in instance directly
          state[item.id] = !!instance[item.id] || !!instance[item.key];
        });
      });
      setLocalState(state);
    }
  }, [instance, templates]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/final-check/${instance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save checkbox");
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["final-checks"] });
      const previous = queryClient.getQueryData<any[]>(["final-checks"]);
      if (previous) {
        queryClient.setQueryData<any[]>(["final-checks"], old => {
          if (!old) return old;
          return old.map(c => c.id === instance.id ? { ...c, ...data } : c);
        });
      }
      return { previous };
    },
    onSuccess: (_data) => {
      setIsSaving(false);
    },
    onError: (err, variables, context: any) => {
      setIsSaving(false);
      toast.error("Network error. Saved state might be out of sync.");
      if (context?.previous) {
        queryClient.setQueryData(["final-checks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["final-checks"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/final-check/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["final-checks"] });
      const previous = queryClient.getQueryData<any[]>(["final-checks"]);
      if (previous) {
        queryClient.setQueryData<any[]>(["final-checks"], old => {
          if (!old) return old;
          return old.filter(c => c.id !== id);
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Checklist securely removed.");
    },
    onError: (err, id, context: any) => {
      toast.error("Delete failed");
      if (context?.previous) {
        queryClient.setQueryData(["final-checks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["final-checks"] });
    }
  });

  const handleToggle = (key: string) => {
    if (instance.isComplete) return;

    setLocalState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      
      // Debounced save
      setIsSaving(true);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateMutation.mutate(next);
      }, 500);

      return next;
    });
  };

  const completeChecklist = () => {
    if (confirm("Mark Job as fully complete? This will disable further modifications and close the linked invoice.")) {
      updateMutation.mutate({ isComplete: true, completedAt: new Date() }, {
        onSuccess: () => {
           toast.success("Job completely finished!");
           queryClient.invalidateQueries({ queryKey: ["final-checks"] });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (confirm("Permanently remove this checklist from the registry?")) {
      deleteMutation.mutate(instance.id);
    }
  };

  if (!instance) return (
    <div className="h-full flex items-center justify-center bg-slate-50 text-slate-400 p-8 text-center rounded-lg border-2 border-dashed border-slate-200 m-8">
      Select a job from the list to view its Final Check protocol.
    </div>
  );

  const calculateTotalProgress = () => Object.values(localState).filter(Boolean).length;
  const totalItems = SECTIONS.reduce((acc: number, sec: any) => acc + sec.items.length, 0);
  const isFullyChecked = totalItems > 0 && calculateTotalProgress() === totalItems;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* Header Readonly Panel */}
      <div className="bg-brand-forest text-white p-6 shrink-0 shadow-md z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold font-mono tracking-widest">{instance.invoiceNumber}</span>
            <h1 className="text-2xl font-bold mt-2">{instance.invoice?.customerName || "Customer"}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isSaving && <span className="text-xs flex items-center text-slate-300"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Saving...</span>}
            {!isSaving && <span className="text-xs flex items-center text-green-400"><Save className="w-3 h-3 mr-1" /> Saved</span>}
            {isAdmin && (
              <button onClick={confirmDelete} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded transition-colors" title="Delete instance">
                <Trash2 className="w-4 h-4 text-red-100" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white/10 p-4 rounded-lg">
          <div>
            <div className="text-slate-400 text-xs">Model Number</div>
            <div className="font-semibold truncate">{instance.modelNumber || "N/A"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Quantity</div>
            <div className="font-semibold">{instance.quantity}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Staff 1</div>
            <div className="font-semibold truncate">{instance.designer || "N/A"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Staff 2</div>
            <div className="font-semibold truncate">{instance.printer || "N/A"}</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-300">
          <span className="text-slate-400 font-medium">Desc: </span>
          {instance.description}
        </p>
      </div>

      {/* Progress Bar Header */}
      <div className="bg-slate-50 border-b p-4 flex items-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex-1">
          <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
            <span>Overall Progress</span>
            <span>{calculateTotalProgress()} / {totalItems}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${isFullyChecked ? 'bg-green-500' : 'bg-brand-forest'}`} 
              style={{ width: `${(calculateTotalProgress() / totalItems) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklists Scrollable View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 pb-32">
        {instance.isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center shadow-sm">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-green-800">Job Complete!</h2>
            <p className="text-green-600 mt-1">This checklist is locked to prevent further modifications.</p>
          </div>
        )}

        {SECTIONS.reduce((acc: { elements: React.ReactNode[], nextIndex: number }, section: any) => {
          const startIndex = acc.nextIndex;
          const sectionChecked = section.items.filter((i: any) => localState[i.id]).length;
          acc.nextIndex += section.items.length;
          acc.elements.push(
            <div key={section.id} className="relative">
              <div className="pt-4 mb-2 flex justify-between items-end border-b pb-2">
                <h3 className="text-lg font-bold text-slate-800">
                  <span className="text-brand-forest mr-2">Sec {acc.nextIndex / section.items.length + 1}</span>
                  {section.name}
                </h3>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {sectionChecked} / {section.items.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item: any, i: number) => {
                  const isChecked = localState[item.id] || false;
                  return (
                    <button
                      key={item.id}
                      disabled={instance.isComplete}
                      onClick={() => handleToggle(item.id)}
                      className={`flex items-start text-left gap-4 p-4 rounded-xl border-2 transition-all ${
                        isChecked
                          ? 'border-green-500 bg-green-50/30 shadow-sm'
                          : 'border-slate-200 hover:border-brand-sage/50 hover:bg-slate-50'
                      } ${instance.isComplete ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-400 text-transparent'
                      }`}>
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                      <span className={`text-sm font-medium leading-relaxed transition-all ${
                        isChecked ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}>
                        {startIndex + i + 1}. {item.label}
                        {item.isRequired && !isChecked && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
          return acc;
        }, { elements: [] as React.ReactNode[], nextIndex: 0 }).elements}
      </div>

      {/* Footer completion action */}
      {!instance.isComplete && isFullyChecked && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t shadow-[0_-10px_40px_rgba(20,22,28,0.1)] z-20 flex justify-end">
          <button 
            disabled={updateMutation.isPending}
            onClick={completeChecklist}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center text-lg"
          >
            {updateMutation.isPending ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <CheckCircle className="w-5 h-5 mr-3"/>}
            Close This Job
          </button>
        </div>
      )}
    </div>
  );
}

