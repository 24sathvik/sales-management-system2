/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import * as Icons from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { memo } from "react";

// Fallback colors if stage.color is invalid/missing
const defaultColors = { bg: "bg-slate-100", text: "text-slate-700", badge: "bg-slate-200", badgeText: "text-slate-600" };

// Column header accent colors matching the spec
const PHASE_HEADER_STYLES: Record<string, { bg: string; text: string; badge: string; badgeText: string }> = {
  RAW_MATERIALS:   { bg: "bg-slate-100",  text: "text-slate-700",  badge: "bg-slate-200",  badgeText: "text-slate-600" },
  DESIGN:          { bg: "bg-purple-50",  text: "text-purple-700", badge: "bg-purple-200", badgeText: "text-purple-700" },
  PRINTING:        { bg: "bg-blue-50",    text: "text-blue-700",   badge: "bg-blue-200",   badgeText: "text-blue-700" },
  POST_PRINTING:   { bg: "bg-cyan-50",    text: "text-cyan-700",   badge: "bg-cyan-200",   badgeText: "text-cyan-700" },
  PAYMENT_PENDING: { bg: "bg-amber-50",   text: "text-amber-700",  badge: "bg-amber-200",  badgeText: "text-amber-700" },
};

const PHASE_BORDER: Record<string, string> = {
  RAW_MATERIALS:   "border-t-[#C77D2E]",
  DESIGN:          "border-t-[#4C4FE0]",
  PRINTING:        "border-t-[#6366F1]",
  POST_PRINTING:   "border-t-[#E8A33D]",
  PAYMENT_PENDING: "border-t-[#D97706]",
};

export const KanbanColumn = memo(function KanbanColumn({ 
  id, 
  stage,
  cards, 
  isAdmin,
  onDelete,
  onMarkComplete,
  onMarkPaymentPending,
}: { 
  id: string;
  stage: any; 
  cards: any[]; 
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
  onMarkPaymentPending: (id: string, phase: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const styles = PHASE_HEADER_STYLES[id] || PHASE_HEADER_STYLES.RAW_MATERIALS;
  const color = stage?.color || "#C77D2E";
  const name = stage?.name || "Unknown Stage";
  const iconName = stage?.icon || "Circle";
  const IconComponent = (Icons as any)[iconName] || Icons.Circle;

  return (
    <div className="flex flex-col flex-shrink-0 w-80 rounded-xl h-full max-h-[calc(100vh-140px)] border border-slate-200 shadow-sm border-t-4 overflow-hidden bg-white" style={{ borderTopColor: color }}>
      {/* Column Header */}
      <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 text-slate-800" style={{ color: color }}>
          <IconComponent className="w-4 h-4" />
          {name}
        </h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
          {cards.length}
        </span>
      </div>

      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
          isOver ? 'bg-slate-100 shadow-inner' : 'bg-slate-50/50'
        }`}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard 
              key={card.id} 
              card={card} 
              isAdmin={isAdmin}
              currentPhase={id}
              onDelete={onDelete}
              onMarkComplete={onMarkComplete}
              onMarkPaymentPending={onMarkPaymentPending}
            />
          ))}
        </SortableContext>
        
        {cards.length === 0 && (
          <div className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 mt-2">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
});
