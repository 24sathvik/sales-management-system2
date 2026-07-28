/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays, startOfDay } from "date-fns";
import { Trash2, ExternalLink, CheckCircle, IndianRupee, FileText } from "lucide-react";
import Link from "next/link";
import { useState, memo } from "react";
import { ChecklistPopover } from "./ChecklistPopover";

const getPriorityDot = (dateStr: string | null, invoiceStatus: string) => {
  if (!dateStr || invoiceStatus !== "ACTIVE") return "bg-slate-300";
  const finalDate = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(finalDate, today);
  if (diff < 0) return "bg-red-600";
  if (diff >= 0 && diff <= 2) return "bg-red-400";
  if (diff >= 3 && diff <= 6) return "bg-amber-400";
  if (diff >= 7 && diff <= 14) return "bg-yellow-400";
  return "bg-green-400";
};



export const KanbanCard = memo(function KanbanCard({ 
  card, 
  isAdmin, 
  onDelete, 
  onMarkComplete,
  onMarkPaymentPending,
  currentPhase,
  isOverlay = false 
}: { 
  card: any; 
  isAdmin: boolean; 
  currentPhase: string;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onMarkPaymentPending: (id: string, phase: string) => void;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { ...card } });

  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const deliveryDate = card.invoice?.finalDeliveryDate;
  const status = card.invoice?.status || "ACTIVE";
  const priorityDot = getPriorityDot(deliveryDate, status);
  const initials = card.invoice?.assignee?.name 
    ? card.invoice.assignee.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2) 
    : "??";
  
  const isPostPrinting = card.stage?.name?.toLowerCase().includes("review") || card.stage?.name?.toLowerCase().includes("ready");
  const isPaymentPending = card.stage?.name?.toLowerCase().includes("payment");
  const leftBorderColor = card.stage?.color || "#E3E1DA";

  // "From Quote" indicator
  const fromQuotation = card.invoice?.quotationId || card.fromQuotation;
  const quoNumber = card.invoice?.quotation?.quotationNumber;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-lg border-l-4 border-r border-y border-slate-200 shadow-sm relative group cursor-grab active:cursor-grabbing flex flex-col gap-2 touch-none transition-shadow hover:shadow-md ${isOverlay ? 'shadow-xl scale-105 rotate-1' : ''}`}
      style={{ ...style, borderLeftColor: leftBorderColor }}
    >
      {/* "From Quote" gold badge */}
      {fromQuotation && (
        <div className="absolute -top-2 right-2 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 z-10">
          <FileText className="w-2.5 h-2.5" /> From Quote
        </div>
      )}

      {/* Payment Pending badge */}
      {isPaymentPending && !fromQuotation && (
        <div className="absolute -top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
          <IndianRupee className="w-3 h-3" /> Awaiting Payment
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between items-start">
          <span className="font-bold text-sm text-primary flex items-center gap-1.5 font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${priorityDot} shrink-0`} title="Priority Indicator" />
            {card.invoiceNumber}
          </span>
          <div className="flex items-center gap-1">
            {isPostPrinting && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkPaymentPending(card.id, currentPhase); }}
                className={`p-1 text-amber-500 hover:bg-amber-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                title="Payment Pending →"
              >
                <IndianRupee className="w-4 h-4" />
              </button>
            )}
            {(isPostPrinting || isPaymentPending) && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkComplete(card.id); }}
                className={`p-1 text-green-600 hover:bg-green-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                title="Mark Complete → Final Check"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                className={`p-1 text-red-500 hover:bg-red-50 rounded bg-white relative z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                title="Remove from board"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs font-semibold text-text-primary mt-1.5">
          {card.customerName}
        </div>

        {fromQuotation && quoNumber && (
          <div className="text-[10px] text-accent font-semibold mt-0.5">
            From <span className="font-mono">{quoNumber}</span>
          </div>
        )}

        <p className="text-xs text-text-secondary line-clamp-2 mt-1" title={card.description}>
          {card.description}
        </p>

        {/* Bottom row: checklist + link + avatar */}
        <div className="flex justify-between items-end mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex flex-col relative z-20">
              <ChecklistPopover cardId={card.id} stageId={card.stageId} isHovered={isHovered} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {card.invoice?.id && (
              <Link 
                href={`/dashboard/invoices/${card.invoice.id}/edit`} 
                className="text-slate-400 hover:text-primary relative z-10 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <div 
              className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold border border-primary/20" 
              title={card.invoice?.assignee?.name || "Unassigned"}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
