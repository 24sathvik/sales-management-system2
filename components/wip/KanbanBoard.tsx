/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  sortableKeyboardCoordinates 
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Layers, ChevronDown } from "lucide-react";
import { PageTour } from "@/components/onboarding/PageTour";


export function KanbanBoard({ 
  initialData, 
  isAdmin 
}: { 
  initialData: { stages: any[]; columns: Record<string, any[]> };
  isAdmin: boolean;
}) {
  const PHASES = initialData.stages.map(s => s.id);
  
  const [columns, setColumns] = useState<Record<string, any[]>>(() => {
    const cols = { ...initialData.columns };
    PHASES.forEach(p => { if (!cols[p]) cols[p] = []; });
    return cols;
  });

  useEffect(() => {
    const cols = { ...initialData.columns };
    PHASES.forEach(p => { if (!cols[p]) cols[p] = []; });
    setColumns(cols);
  }, [initialData]);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [activeMobilePhase, setActiveMobilePhase] = useState(PHASES[0] || "");
  
  const queryClient = useQueryClient();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      // Press and hold 250ms before drag starts so normal touch scroll still works
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveMutation = useMutation({
    mutationFn: async ({ id, stageId, order, version }: { id: string, stageId: string, order: number, version: number }) => {
      const res = await fetch(`/api/wip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, order, version }),
      });
      if (res.status === 409) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "This card was updated by someone else.");
      }
      if (!res.ok) throw new Error("Failed to move card");
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["wip"] });
      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData<Record<string, any[]>>(["wip"]);
      
      if (previous) {
        const newCols = { ...previous };
        PHASES.forEach(p => { if (newCols[p]) newCols[p] = [...newCols[p]]; });
        
        let cardToMove = null;
        for (const p of PHASES) {
          const idx = newCols[p]?.findIndex(c => c.id === variables.id);
          if (idx !== undefined && idx !== -1) {
            cardToMove = newCols[p][idx];
            newCols[p].splice(idx, 1);
            break;
          }
        }
        
        if (cardToMove) {
          cardToMove = { ...cardToMove, stageId: variables.stageId };
          if (!newCols[variables.stageId]) newCols[variables.stageId] = [];
          newCols[variables.stageId].splice(variables.order, 0, cardToMove);
          queryClient.setQueryData(["wip"], newCols);
        }
      }
      return { previous };
    },
    onError: (err: any, _vars, context: any) => {
      if (err.message && err.message.includes("someone else")) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save card position.");
      }
      // Rollback to previous server state
      if (context?.previous) {
        queryClient.setQueryData(["wip"], context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wip/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete card");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["wip"] });
      const previous = queryClient.getQueryData<Record<string, any[]>>(["wip"]);
      if (previous) {
        const newCols = { ...previous };
        for (const phase in newCols) {
          newCols[phase] = newCols[phase].filter(c => c.id !== id);
        }
        queryClient.setQueryData(["wip"], newCols);
      }
      return { previous };
    },
    onError: (err, id, context: any) => {
      toast.error("Failed to delete card.");
      if (context?.previous) {
        queryClient.setQueryData(["wip"], context.previous);
      }
    },
    onSuccess: () => {
      toast.success("Card removed.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const finalCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/final-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wipCardId: id }),
      });
      if (!res.ok) throw new Error("Failed to transfer to final check");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["wip"] });
      const previous = queryClient.getQueryData<Record<string, any[]>>(["wip"]);
      if (previous) {
        const newCols = { ...previous };
        for (const phase in newCols) {
          newCols[phase] = newCols[phase].filter(c => c.id !== id);
        }
        queryClient.setQueryData(["wip"], newCols);
      }
      return { previous };
    },
    onError: (err, id, context: any) => {
      toast.error("Failed to transfer to final check.");
      if (context?.previous) {
        queryClient.setQueryData(["wip"], context.previous);
      }
    },
    onSuccess: () => {
      toast.success("Card moved to Final Check.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wip"] });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    
    // Find active card
    let activeItem;
    for (const phase of PHASES) {
      activeItem = columns[phase].find(card => card.id === id);
      if (activeItem) break;
    }
    setActiveCard(activeItem || null);
  };

  const findContainer = (id: string, items: Record<string, any[]>) => {
    if (id in items) return id;
    return Object.keys(items).find((key) => items[key].some((item) => item.id === id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    setColumns((prev) => {
      const activeContainer = findContainer(activeId as string, prev);
      const overContainer = findContainer(overId as string, prev);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }

      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];

      const activeIndex = activeItems.findIndex(t => t.id === activeId);
      const overIndex = overItems.findIndex(t => t.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      const [item] = activeItems.splice(activeIndex, 1);
      item.stageId = overContainer; // update local stageId
      overItems.splice(newIndex, 0, item);

      return {
        ...prev,
        [activeContainer]: activeItems,
        [overContainer]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId as string, columns);
    const overContainer = findContainer(overId as string, columns);

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = columns[activeContainer].findIndex(t => t.id === activeId);
      const overIndex = columns[overContainer].findIndex(t => t.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
        }));
      }
    }

    setActiveCard(null);

    // Save persistence debounced
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      // Find the card's new phase and order
      let finalPhase = "";
      let finalOrder = 0;
      let finalVersion = 0;
      let cardFound = false;
      
      for (const phase of PHASES) {
        setColumns(currentCols => {
          const idx = currentCols[phase].findIndex(c => c.id === activeId);
          if (idx !== -1) {
            finalPhase = phase;
            finalOrder = idx;
            finalVersion = currentCols[phase][idx].version || 0;
            cardFound = true;
          }
          return currentCols;
        });
        if (cardFound) break;
      }

      if (cardFound) {
        moveMutation.mutate({ id: activeId as string, stageId: finalPhase, order: finalOrder, version: finalVersion });
      }
    }, 500);
  };

  const confirmDelete = useCallback((id: string) => {
    if (confirm("Remove from board? Invoice will not be deleted.")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const confirmMarkComplete = useCallback((id: string) => {
    if (confirm("Move to Final Check?")) {
      finalCheckMutation.mutate(id);
    }
  }, [finalCheckMutation]);

  const markPaymentPending = useCallback((id: string, currentPhase: string) => {
    // Find the payment pending stage dynamically if possible
    const paymentStage = initialData.stages.find(s => s.name.toLowerCase().includes("payment"))?.id || PHASES[PHASES.length - 1];
    
    // We can't synchronously get the version without `columns`, but we can just use 0 or fetch it optimistically
    // A better approach is to pass version from KanbanCard if we wanted, but we'll use 0 for now as the server 
    // often handles optimistic versioning gracefully if it's not strictly enforced, or we can use the previous trick.
    // Wait, let's just pass `version` from `KanbanCard` instead of looking it up in `columns`.
    // Actually, `setColumns` state updates handle it. Let's just use 0, if there's a conflict the server will reject it,
    // but the backend only strictly enforces versioning if they match. Wait, the backend requires it.
    // Let's use `queryClient.getQueryData` to get the current version!
    const currentWip = queryClient.getQueryData<Record<string, any[]>>(["wip"]);
    const card = currentWip?.[currentPhase]?.find(c => c.id === id);
    const version = card?.version || 0;

    moveMutation.mutate({ id, stageId: paymentStage, order: 0, version });
    // Optimistically update local state to reflect the transition visually immediately
    setColumns((prev) => {
      const activeItems = [...(prev[currentPhase] || [])];
      const itemIndex = activeItems.findIndex((c) => c.id === id);
      if (itemIndex > -1) {
        const [item] = activeItems.splice(itemIndex, 1);
        item.stageId = paymentStage;
        const newOverItems = [item, ...(prev[paymentStage] || [])];
        return {
          ...prev,
          [currentPhase]: activeItems,
          [paymentStage]: newOverItems,
        };
      }
      return prev;
    });
  }, [initialData.stages, moveMutation, PHASES, queryClient]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <PageTour 
        tourId="wip"
        steps={[
          {
            element: '.tour-kanban-board',
            popover: {
              title: 'Work In Progress Board',
              description: 'This is where every active order’s production status lives. As work gets done, you move cards from left to right.',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '.tour-k-columns',
            popover: {
              title: 'Production Stages',
              description: 'These columns represent your fulfillment process sequentially. Some stages have mandatory checklist items that must be completed before the card can advance.',
              side: "bottom"
            }
          },
          {
            element: '.tour-k-cards',
            popover: {
              title: 'Interactive Cards',
              description: 'Simply drag and drop these cards to move them between stages. Notice the color-coded left edge—red means the order is due within 48 hours or already overdue.',
              side: "right"
            }
          }
        ]}
      />
      {/* Mobile Phase Selector */}
      {!Object.values(columns).every(col => col.length === 0) && (
        <div className="md:hidden sticky top-0 z-30 bg-background pt-2 pb-3 mb-2 border-b border-border">
          <div className="relative">
            <select
              value={activeMobilePhase}
              onChange={(e) => setActiveMobilePhase(e.target.value)}
              className="w-full appearance-none bg-brand-cream border border-brand-border text-brand-forest font-bold py-3 pl-4 pr-10 rounded-xl outline-none shadow-sm"
            >
              {initialData.stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name} ({columns[stage.id]?.length || 0})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-forest pointer-events-none" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-6 overflow-x-auto pb-6 h-full min-h-[500px] snap-x pt-2 tour-kanban-board tour-k-columns tour-k-cards">
        {Object.values(columns).every(col => col.length === 0) ? (
          <div className="w-full h-full min-h-[400px] flex items-center justify-center p-8">
            <EmptyState 
              icon={Layers}
              title="No work in progress"
              description="Your production pipeline is empty. Accept a quotation or create an invoice to populate it."
              actionLabel="Create Invoice"
              actionHref="/dashboard/invoices/new"
            />
          </div>
        ) : (
          PHASES.map((phase) => (
            <div 
              key={phase} 
              className={`snap-center h-full w-full md:w-auto flex-shrink-0 ${phase === activeMobilePhase ? 'block' : 'hidden md:block'}`}
            >
              <KanbanColumn 
                key={phase} 
                id={phase} 
                stage={initialData.stages.find(s => s.id === phase)}
                cards={columns[phase] || []} 
                isAdmin={isAdmin}
                onDelete={confirmDelete}
                onMarkComplete={confirmMarkComplete}
                onMarkPaymentPending={markPaymentPending}
              />
            </div>
          ))
        )}
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCard 
            card={activeCard} 
            isAdmin={isAdmin}
            currentPhase={activeCard.stageId || ""}
            onDelete={() => {}}
            onMarkComplete={() => {}}
            onMarkPaymentPending={() => {}}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
