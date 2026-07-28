/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Square, Loader2, ClipboardCheck, ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function ChecklistPopover({ cardId, stageId }: { cardId: string; stageId: string; isHovered?: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: checklistData, isLoading } = useQuery({
    queryKey: ["checklist", cardId, stageId],
    queryFn: async () => {
      const res = await fetch(`/api/wip/${cardId}/checklist?stageId=${stageId}`);
      if (!res.ok) throw new Error("Failed to load checklist");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string, isChecked: boolean }) => {
      const res = await fetch(`/api/wip/${cardId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isChecked })
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: ["checklist", cardId, stageId] });
      const previous = queryClient.getQueryData(["checklist", cardId, stageId]);
      if (previous) {
        const data = previous as any;
        const newResponses = [...(data.responses || [])];
        const idx = newResponses.findIndex((r: any) => r.itemId === itemId);
        if (idx >= 0) {
          newResponses[idx] = { ...newResponses[idx], isChecked };
        } else {
          newResponses.push({ itemId, isChecked });
        }
        queryClient.setQueryData(["checklist", cardId, stageId], { ...data, responses: newResponses });
      }
      return { previous };
    },
    onError: (err, newTodo, context: any) => {
      toast.error("Failed to update checklist.");
      if (context?.previous) {
        queryClient.setQueryData(["checklist", cardId, stageId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", cardId, stageId] });
      queryClient.invalidateQueries({ queryKey: ["final-checks"] });
    },
  });

  const template = checklistData?.template;
  const items = template?.items || [];
  const responses = checklistData?.responses || [];
  
  const totalItems = items.length;
  let completedItems = 0;

  if (items.length > 0) {
    completedItems = items.filter((item: any) => {
      const r = responses.find((res: any) => res.itemId === item.id);
      return r?.isChecked;
    }).length;
  }

  const fractionText = `${completedItems}/${totalItems}`;
  const isComplete = totalItems > 0 && completedItems === totalItems;
  const isPartial = completedItems > 0 && completedItems < totalItems;

  const colorClass = isComplete ? "text-green-600 bg-green-50 border-green-200" 
    : isPartial ? "text-amber-600 bg-amber-50 border-amber-200" 
    : "text-slate-500 bg-slate-50 border-slate-200";

  if (totalItems === 0 && !isLoading) return null;

  const modalContent = isOpen ? (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-xl shadow-[0_0_50px_-12px_rgba(20,22,28,0.55)] border border-brand-border flex flex-col md:max-h-[85vh] max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-cream/40 p-4 border-b border-brand-border relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="pr-6">
            <h4 className="text-sm font-bold text-brand-forest uppercase tracking-wider flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-brand-sage" />
              {template?.name || "Stage Checklist"}
            </h4>
            
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="h-2 w-full bg-brand-border/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-green-500' : 'bg-brand-sage'}`} 
                  style={{ width: `${(completedItems / totalItems) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-brand-muted shrink-0 w-8 text-right">
                {fractionText}
              </span>
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="bg-green-50 px-4 py-2 border-b border-green-100/50 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
            All checks securely completed ✓
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-brand-sage/20 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-brand-muted">
              <Loader2 className="w-6 h-6 animate-spin text-brand-sage" />
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item: any) => {
                const response = responses.find((r: any) => r.itemId === item.id);
                const checked = response?.isChecked || false;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      updateMutation.mutate({ itemId: item.id, isChecked: !checked });
                    }}
                    className="w-full py-2.5 px-3 text-left flex items-start gap-3 hover:bg-brand-cream/50 rounded-lg transition-colors group/btn border border-transparent hover:border-brand-border bg-white"
                  >
                    <div className={`mt-0.5 flex-shrink-0 transition-colors ${checked ? 'text-green-500' : 'text-slate-300 group-hover/btn:text-brand-sage'}`}>
                      {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <span className={`text-[13px] leading-snug select-none transition-colors ${checked ? 'text-slate-400 line-through' : 'text-brand-black font-semibold'}`}>
                      {item.label}
                      {item.isRequired && !checked && <span className="text-red-500 ml-1 text-[10px]">*</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-brand-cream/30 p-3 border-t border-brand-border shrink-0">
          <Link 
            href={`/dashboard/final-check?invoiceId=${checklistData?.invoiceId || ''}`}
            className="flex items-center justify-center gap-1.5 w-full bg-white border border-brand-border rounded-lg py-2 text-xs font-bold text-brand-forest hover:bg-brand-sage hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
            target="_blank"
          >
            Open Full Audit Log <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors select-none hover:opacity-80 ${colorClass}`}
        title="Open Checklist"
      >
        <ClipboardCheck className="w-3 h-3" />
        {fractionText}
      </button>
      
      {mounted ? createPortal(modalContent, document.body) : null}
    </>
  );
}
