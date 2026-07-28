export function PurchasesPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full animate-pulse">
      {/* ── HEADER ── */}
      <div>
        <div className="h-8 w-48 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-64 bg-slate-200 rounded-md mt-2"></div>
      </div>

      {/* ── 4 SUMMARY STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-200 rounded-xl h-24 border border-slate-200"></div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-slate-200 rounded-xl h-16 border border-slate-200 w-full mb-2"></div>

      {/* ── TABLE ── */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Table Header Simulation */}
        <div className="h-12 bg-slate-300 w-full mb-2"></div>
        
        {/* Table Rows Simulation */}
        <div className="flex flex-col gap-3 px-4 py-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
            <div key={row} className="flex gap-4 items-center mb-2">
              <div className="h-4 w-10 bg-slate-200 rounded"></div>
              <div className="h-4 w-28 bg-slate-200 rounded"></div>
              <div className="h-4 w-40 bg-slate-200 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
              <div className="h-4 w-48 bg-slate-200 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
