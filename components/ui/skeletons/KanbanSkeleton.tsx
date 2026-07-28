function KanbanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-slate-200 p-3 shadow-sm space-y-2.5">
      <div className="flex justify-between items-center">
        <div className="skeleton h-3.5 w-20 rounded" />
        <div className="skeleton h-6 w-6 rounded-full" />
      </div>
      <div className="skeleton h-3 w-28 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ cardCount = 2 }: { cardCount?: number }) {
  return (
    <div className="flex flex-col flex-shrink-0 w-80 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-slate-200 overflow-hidden bg-white">
      <div className="p-3 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton h-5 w-8 rounded-full" />
      </div>
      <div className="flex-1 p-3 bg-slate-50 space-y-3 min-h-[200px]">
        {Array.from({ length: cardCount }).map((_, i) => (
          <KanbanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton({ columns = 5 }: { columns?: number }) {
  const cardCounts = [3, 2, 3, 2, 1];
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[500px] snap-x pt-2">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="snap-center h-full">
          <KanbanColumnSkeleton cardCount={cardCounts[i % cardCounts.length]} />
        </div>
      ))}
    </div>
  );
}
